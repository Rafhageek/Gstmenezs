import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com privilégios de service_role.
 *
 * ⚠️ ATENÇÃO: este cliente IGNORA Row Level Security e tem acesso
 * total ao banco. Use APENAS em código de servidor que já validou
 * a permissão do usuário (ex.: confirmou que é admin).
 *
 * Nunca importe este arquivo em Client Components ou rotas públicas.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
