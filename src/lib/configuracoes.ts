import { createClient } from "@/lib/supabase/server";
import type { Configuracoes } from "@/types/database";

/** Configurações padrão se a migration 0005 ainda não tiver sido aplicada. */
const FALLBACK: Configuracoes = {
  id: 1,
  razao_social: "Menezes Advocacia",
  nome_fantasia: null,
  cnpj: null,
  oab: null,
  endereco: null,
  telefone: null,
  email: null,
  site: null,
  logo_url: null,
  cor_primaria: "#c9a961",
  legenda_pdf:
    "Documento gerado pelo sistema Painel Financeiro — uso interno do escritório",
  updated_at: new Date().toISOString(),
  updated_by: null,
};

/**
 * Busca as configurações do escritório. Usado em server components e
 * rotas de PDF. Retorna FALLBACK caso a tabela ainda não exista.
 */
export async function getConfiguracoes(): Promise<Configuracoes> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", 1)
    .single<Configuracoes>();
  if (error || !data) return FALLBACK;
  return data;
}
