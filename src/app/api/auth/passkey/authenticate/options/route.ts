import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
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

  const { rpID } = await getWebauthnConfig();
  const admin = createAdminClient();

  const { data: passkeys } = await admin
    .from("passkeys")
    .select("credential_id, transports")
    .eq("user_id", user.id)
    .returns<Pick<Passkey, "credential_id" | "transports">[]>();

  if (!passkeys || passkeys.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma biometria cadastrada para este usuário" },
      { status: 404 },
    );
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((p) => ({
      id: p.credential_id,
      transports: (p.transports ?? []) as AuthenticatorTransport[],
    })),
    userVerification: "preferred",
  });

  await admin.from("passkey_challenges").upsert({
    user_id: user.id,
    challenge: options.challenge,
    tipo: "authenticate",
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });

  return NextResponse.json(options);
}
