import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebauthnConfig } from "@/lib/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Validade do desbloqueio biométrico (12 horas). */
const UNLOCK_DURATION_HOURS = 12;
const UNLOCK_COOKIE = "mnz_unlock_at";

interface Body {
  response: AuthenticationResponseJSON;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const admin = createAdminClient();

  const { data: challengeRow } = await admin
    .from("passkey_challenges")
    .select("challenge, tipo, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !challengeRow ||
    challengeRow.tipo !== "authenticate" ||
    new Date(challengeRow.expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "Challenge expirado. Recarregue a página." },
      { status: 400 },
    );
  }

  // Busca a credencial pelo id
  const credentialId = body.response.id;
  const { data: passkey, error: fetchErr } = await admin
    .from("passkeys")
    .select("*")
    .eq("user_id", user.id)
    .eq("credential_id", credentialId)
    .maybeSingle();

  if (fetchErr || !passkey) {
    return NextResponse.json(
      { error: "Credencial não reconhecida" },
      { status: 404 },
    );
  }

  const { rpID, origin } = await getWebauthnConfig();

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credential_id,
        publicKey: new Uint8Array(
          Buffer.from(passkey.public_key, "base64url"),
        ),
        counter: Number(passkey.counter),
        transports: passkey.transports ?? undefined,
      },
      requireUserVerification: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha na verificação";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json(
      { error: "Biometria não verificada" },
      { status: 400 },
    );
  }

  // Atualiza counter e último uso
  await admin
    .from("passkeys")
    .update({
      counter: verification.authenticationInfo.newCounter,
      ultimo_uso_em: new Date().toISOString(),
    })
    .eq("id", passkey.id);

  // Consome o challenge
  await admin.from("passkey_challenges").delete().eq("user_id", user.id);

  // Grava cookie de unlock (válido por 12 horas, HTTP-only, Secure em produção)
  const cookieStore = await cookies();
  cookieStore.set({
    name: UNLOCK_COOKIE,
    value: String(Date.now()),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UNLOCK_DURATION_HOURS * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
