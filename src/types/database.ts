/**
 * Tipos TypeScript do schema Supabase.
 *
 * Espelha manualmente o schema definido em
 * `supabase/migrations/0001_initial_schema.sql`.
 *
 * Para regenerar automaticamente quando o schema mudar:
 *   npx supabase gen types typescript --project-id uwsulxmeiwlyakgtobjc \
 *     --schema public > src/types/database.ts
 */

export type UserRole = "admin" | "financeiro" | "contador";
export type CessaoStatus = "ativa" | "quitada" | "inadimplente" | "cancelada";
export type PagamentoTipo = "parcela" | "estorno" | "ajuste";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  oab: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface DadosBancarios {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo?: "corrente" | "poupanca";
  pix?: string;
}

export interface ClientePrincipal {
  id: string;
  nome: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  endereco: Endereco | null;
  observacoes: string | null;
  ativo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Cessionario {
  id: string;
  nome: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  endereco: Endereco | null;
  banco: DadosBancarios | null;
  observacoes: string | null;
  ativo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CessaoCredito {
  id: string;
  numero_contrato: string;
  cliente_principal_id: string;
  cessionario_id: string;
  valor_total: number;
  valor_pago: number;
  parcelas_total: number;
  data_cessao: string;
  data_vencimento_inicial: string;
  status: CessaoStatus;
  taxa_juros: number | null;
  observacoes: string | null;
  documento_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Pagamento {
  id: string;
  cessao_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  tipo: PagamentoTipo;
  comprovante_url: string | null;
  is_reversal: boolean;
  reversal_of: string | null;
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LogAuditoria {
  id: string;
  user_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LogAuditoriaView extends LogAuditoria {
  user_nome: string;
  user_email: string | null;
  user_role: UserRole | null;
}

export interface CessaoResumo {
  id: string;
  numero_contrato: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  percentual_pago: number;
  status: CessaoStatus;
  data_cessao: string;
  data_vencimento_inicial: string;
  cliente_nome: string;
  cessionario_nome: string;
  primeira_parcela_atrasada: string | null;
}

export interface FluxoMensal {
  mes: string;
  mes_label: string;
  previsto: number;
  realizado: number;
}

export interface InadimplenciaItem {
  pagamento_id: string;
  cessao_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  dias_atraso: number;
  numero_contrato: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_documento: string;
  cessionario_nome: string;
}

export interface ExtratoCliente {
  cliente_id: string;
  cliente_nome: string;
  cliente_documento: string;
  total_cessoes: number;
  cessoes_ativas: number;
  cessoes_quitadas: number;
  volume_total: number;
  total_recebido: number;
  saldo_devedor: number;
}
