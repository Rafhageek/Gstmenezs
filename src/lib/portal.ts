import { createAdminClient } from "@/lib/supabase/admin";
import type { PortalContexto } from "@/types/database";

/**
 * Valida um token de portal de contador.
 *
 * Retorna o contexto (cliente_id, nome, descrição, validade) se o token
 * for válido. Retorna null se:
 *   - Token não existe
 *   - Token foi revogado
 *   - Token está expirado
 *
 * A validação também incrementa o contador de acessos e registra o
 * último acesso (best-effort).
 *
 * NOTA: usa service_role via createAdminClient porque a rota é pública
 * (sem sessão Supabase Auth). A função RPC é SECURITY DEFINER e já tem
 * grant para o role `anon`, mas isolamos aqui para garantir execução
 * controlada.
 */
export async function validarTokenPortal(
  token: string,
): Promise<PortalContexto | null> {
  if (!token || typeof token !== "string" || token.length < 10) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("validar_portal_token", {
    p_token: token,
  });

  if (error || !data || data.length === 0) return null;

  const row = data[0] as PortalContexto;
  return row;
}
