import { headers } from "next/headers";

/**
 * Configuração do Relying Party (RP) para WebAuthn.
 *
 * O rpID é o "domínio de autoridade" — precisa ser o mesmo nos
 * endpoints de register/authenticate e no navegador. Usamos o host
 * sem porta. Em localhost, o navegador aceita apenas "localhost".
 */
export async function getWebauthnConfig() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  const hostname = host.split(":")[0];
  const origin = `${proto}://${host}`;

  return {
    rpID: hostname,
    rpName: "Painel MNZ — Menezes Advocacia",
    origin,
  };
}
