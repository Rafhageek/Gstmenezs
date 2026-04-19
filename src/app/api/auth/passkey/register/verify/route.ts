import { NextResponse, type NextRequest } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebauthnConfig } from "@/lib/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  response: RegistrationResponseJSON;
  nome_dispositivo: string;
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
  if (!body.response) {
    return NextResponse.json({ error: "resposta inválida" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: challengeRow } = await admin
    .from("passkey_challenges")
    .select("challenge, tipo, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !challengeRow ||
    challengeRow.tipo !== "register" ||
    new Date(challengeRow.expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: "Challenge expirado. Reinicie o processo." },
      { status: 400 },
    );
  }

  const { rpID, origin } = await getWebauthnConfig();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha na verificação";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json(
      { error: "Credencial não pôde ser verificada" },
      { status: 400 },
    );
  }

  const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
    verification.registrationInfo;

  const nomeDispositivo =
    body.nome_dispositivo?.trim() || detectarDispositivo(req);

  const { error: insertErr } = await admin.from("passkeys").insert({
    user_id: user.id,
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: credential.transports ?? null,
    nome_dispositivo: nomeDispositivo,
    aaguid: aaguid ?? null,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Consome o challenge
  await admin.from("passkey_challenges").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}

function detectarDispositivo(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? "";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Dispositivo";
}
