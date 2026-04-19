import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWebauthnConfig } from "@/lib/webauthn";
import type { Passkey } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const { rpID, rpName } = await getWebauthnConfig();
  const admin = createAdminClient();

  // Busca passkeys existentes para excluir (evitar duplicar no mesmo device)
  const { data: existentes } = await admin
    .from("passkeys")
    .select("credential_id, transports")
    .eq("user_id", user.id)
    .returns<Pick<Passkey, "credential_id" | "transports">[]>();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email ?? user.id,
    userDisplayName:
      (user.user_metadata?.nome as string | undefined) ?? user.email ?? "",
    attestationType: "none",
    excludeCredentials: (existentes ?? []).map((p) => ({
      id: p.credential_id,
      transports: (p.transports ?? []) as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
    supportedAlgorithmIDs: [-7, -257],
  });

  // Guarda challenge vinculado ao usuário (anti-replay)
  await admin.from("passkey_challenges").upsert({
    user_id: user.id,
    challenge: options.challenge,
    tipo: "register",
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });

  return NextResponse.json(options);
}
