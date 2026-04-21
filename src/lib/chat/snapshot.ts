import type { SupabaseClient } from "@supabase/supabase-js";

function formatBRL(v: number | null | undefined): string {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("pt-BR");
}

interface ResumoGeralRow {
  qtd_liquidadas: number | null;
  qtd_a_receber: number | null;
  qtd_canceladas: number | null;
  valor_liquidado: number | null;
  valor_a_receber: number | null;
  valor_recebido_total: number | null;
  volume_total: number | null;
}

interface CessaoResumoRow {
  numero_contrato: string;
  cliente_nome: string;
  cessionario_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  percentual_pago: number;
  status: string;
  data_cessao: string;
  data_vencimento_inicial: string;
  primeira_parcela_atrasada: string | null;
}

interface InadimplenciaRow {
  numero_contrato: string;
  cliente_nome: string;
  cessionario_nome: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  dias_atraso: number;
}

interface ClienteRow {
  nome: string;
  documento: string;
  ativo: boolean;
  telefone: string | null;
}

interface CessionarioRow {
  nome: string;
  documento: string;
  tipo_pessoa: string | null;
  valor_cessao: number | null;
  percentual: number | null;
  data_contrato: string | null;
  ativo: boolean;
}

interface FluxoRow {
  mes_label: string;
  previsto: number;
  realizado: number;
}

/**
 * Monta um snapshot textual do painel para uso como contexto do LLM.
 * Compacto (<5k tokens) e enxuto — evita JSON pra economizar tokens.
 */
export async function buildPainelSnapshot(
  supabase: SupabaseClient,
): Promise<string> {
  const [resumoRes, cessoesRes, inadRes, clientesRes, cessionariosRes, fluxoRes] =
    await Promise.all([
      supabase.from("v_resumo_geral").select("*").maybeSingle<ResumoGeralRow>(),
      supabase
        .from("v_cessoes_resumo")
        .select(
          "numero_contrato, cliente_nome, cessionario_nome, valor_total, valor_pago, saldo_devedor, percentual_pago, status, data_cessao, data_vencimento_inicial, primeira_parcela_atrasada",
        )
        .order("data_cessao", { ascending: false })
        .limit(40)
        .returns<CessaoResumoRow[]>(),
      supabase
        .from("v_inadimplencia")
        .select(
          "numero_contrato, cliente_nome, cessionario_nome, numero_parcela, valor, data_vencimento, dias_atraso",
        )
        .order("dias_atraso", { ascending: false })
        .limit(15)
        .returns<InadimplenciaRow[]>(),
      supabase
        .from("clientes_principais")
        .select("nome, documento, ativo, telefone")
        .order("created_at", { ascending: false })
        .limit(30)
        .returns<ClienteRow[]>(),
      supabase
        .from("cessionarios")
        .select(
          "nome, documento, tipo_pessoa, valor_cessao, percentual, data_contrato, ativo",
        )
        .order("created_at", { ascending: false })
        .limit(30)
        .returns<CessionarioRow[]>(),
      supabase
        .from("v_fluxo_mensal")
        .select("mes_label, previsto, realizado")
        .returns<FluxoRow[]>(),
    ]);

  const resumo = resumoRes.data;
  const cessoes = cessoesRes.data ?? [];
  const inad = inadRes.data ?? [];
  const clientes = clientesRes.data ?? [];
  const cessionarios = cessionariosRes.data ?? [];
  const fluxo = fluxoRes.data ?? [];

  const partes: string[] = [];
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  partes.push(`Data de hoje: ${hoje}`);

  if (resumo) {
    partes.push("", "## Resumo geral");
    partes.push(
      `- Volume total cadastrado: ${formatBRL(resumo.volume_total)}`,
    );
    partes.push(
      `- A receber: ${formatBRL(resumo.valor_a_receber)} em ${resumo.qtd_a_receber ?? 0} cessão(ões)`,
    );
    partes.push(
      `- Já liquidado: ${formatBRL(resumo.valor_liquidado)} em ${resumo.qtd_liquidadas ?? 0} cessão(ões)`,
    );
    partes.push(
      `- Total já recebido (pagos parciais + liquidados): ${formatBRL(resumo.valor_recebido_total)}`,
    );
    partes.push(`- Canceladas: ${resumo.qtd_canceladas ?? 0}`);
  }

  if (inad.length > 0) {
    const somaAtraso = inad.reduce((s, r) => s + Number(r.valor), 0);
    partes.push("", `## Parcelas em atraso (${inad.length} maiores)`);
    partes.push(`Total em atraso nessa amostra: ${formatBRL(somaAtraso)}`);
    for (const r of inad) {
      partes.push(
        `- ${r.cliente_nome} (p/ ${r.cessionario_nome}) — parcela ${r.numero_parcela} do contrato ${r.numero_contrato}: ${formatBRL(r.valor)}, venceu em ${formatDate(r.data_vencimento)} (${r.dias_atraso} dias de atraso)`,
      );
    }
  } else {
    partes.push("", "## Inadimplência", "Nenhuma parcela em atraso no momento.");
  }

  if (cessoes.length > 0) {
    partes.push("", `## Cessões cadastradas (${cessoes.length} mais recentes)`);
    for (const c of cessoes) {
      partes.push(
        `- [${c.status}] ${c.numero_contrato}: ${c.cliente_nome} → ${c.cessionario_nome}, total ${formatBRL(c.valor_total)}, pago ${formatBRL(c.valor_pago)} (${Number(c.percentual_pago).toFixed(1)}%), saldo ${formatBRL(c.saldo_devedor)}. Cessão em ${formatDate(c.data_cessao)}, 1º venc. ${formatDate(c.data_vencimento_inicial)}${c.primeira_parcela_atrasada ? `, atrasou desde ${formatDate(c.primeira_parcela_atrasada)}` : ""}`,
      );
    }
  }

  if (cessionarios.length > 0) {
    partes.push(
      "",
      `## Cessionários cadastrados (${cessionarios.length} mais recentes)`,
    );
    for (const c of cessionarios) {
      const ativo = c.ativo ? "ativo" : "inativo";
      partes.push(
        `- ${c.nome} (${c.tipo_pessoa ?? "?"}, doc ${c.documento}, ${ativo}): cessão ${formatBRL(c.valor_cessao)}, ${c.percentual != null ? `${c.percentual}% cedida` : "% não informada"}, contrato ${formatDate(c.data_contrato)}`,
      );
    }
  }

  if (clientes.length > 0) {
    partes.push("", `## Clientes (cedentes) cadastrados (${clientes.length})`);
    for (const c of clientes) {
      partes.push(
        `- ${c.nome} (doc ${c.documento}${c.telefone ? `, tel ${c.telefone}` : ""}, ${c.ativo ? "ativo" : "inativo"})`,
      );
    }
  }

  if (fluxo.length > 0) {
    partes.push("", "## Fluxo mensal (últimos meses)");
    for (const f of fluxo.slice(-6)) {
      partes.push(
        `- ${f.mes_label}: previsto ${formatBRL(f.previsto)}, realizado ${formatBRL(f.realizado)}`,
      );
    }
  }

  return partes.join("\n");
}

/**
 * Conhecimento do domínio + mapa de navegação.
 * Estático — não muda entre requests.
 */
export const DOMINIO_PROMPT = `
# Sobre o sistema

**Painel Financeiro da Menezes Advocacia** — gerencia cessões de crédito.

## Glossário
- **Cedente (ou Cliente Principal):** titular original do crédito. Principal real do sistema: Marcos André de Andrade.
- **Cessionário:** pessoa física ou jurídica que COMPRA uma fatia do crédito do cedente. Recebe os pagamentos conforme parcelas são quitadas.
- **Cessão:** contrato que formaliza a transferência de uma fatia do crédito do cedente para um cessionário.
- **% cedida:** fatia do crédito TOTAL do cedente que foi transferida ao cessionário. Ex: 0,028% significa que o cessionário tem direito a apenas 0,028% do crédito total — NÃO é o que já foi pago, é a proporção do total.
- **Liquidada:** cessão com todas as parcelas pagas.
- **Inadimplente:** parcela vencida e não paga.
- **A receber / Ativa:** cessão ainda com saldo devedor.

## Mapa de navegação
- **Visão geral (Dashboard):** /dashboard — filtro por Mês/Ano, KPIs, fluxo mensal, pizza de cessões, assistente (você).
- **Clientes (cedentes):** /dashboard/clientes — lista e cadastro de titulares do crédito.
- **Cessionários:** /dashboard/cessionarios — lista, filtros por período (Mês+Ano), abas Todos/Ativos/Inativos, busca, colunas ordenáveis.
- **Cessões:** /dashboard/cessoes — contratos, cronograma de parcelas, registrar pagamento.
- **Agenda:** /dashboard/agenda — parcelas a vencer.
- **Pagamentos:** /dashboard/pagamentos — histórico.
- **Relatórios:** /dashboard/relatorios.
- **Admin > Dados demo:** popular/limpar dados fictícios.
- **Admin > Portal do contador:** links de acesso externo.

## Como fazer coisas comuns
- **Cadastrar cliente:** Clientes > Clientes > "+ Novo cliente".
- **Cadastrar cessionário:** Clientes > Cessionários > "+ Novo cessionário" (tipo PF/PJ, dados do contrato, dados bancários).
- **Cadastrar cessão:** Operação > Cessões > "+ Nova cessão" (cliente + cessionário, valor, parcelas, datas).
- **Registrar pagamento:** abrir a cessão > Cronograma de parcelas > "Registrar pagamento".
- **Gerar PDF:** na tela do cliente ou da cessão, botão "⬇ Extrato PDF".
- **Enviar por WhatsApp:** botão verde ao lado do Extrato PDF (abre conversa com o cliente).

## Regras de resposta
- Responda SEMPRE em português do Brasil.
- Seja objetivo e direto. Respostas curtas (1–3 frases) quando possível.
- Use **negrito** para termos-chave e listas com "•" quando fizer sentido.
- Se a pergunta pedir dados, use APENAS os dados do snapshot do painel fornecido. Não invente valores, nomes ou contratos.
- Se o snapshot não tiver a resposta, diga honestamente que não encontrou e sugira onde o usuário pode olhar no sistema.
- Nunca cite CPF/CNPJ completos por segurança — mascare (ex.: "***.456.789-**").
- Para cálculos, mostre o raciocínio de forma curta.
- Se perguntarem sobre algo fora do escopo (cessões/sistema), avise gentilmente que é especialista no painel.
`.trim();
