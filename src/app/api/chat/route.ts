import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { askGemini, isGeminiEnabled } from "@/lib/chat/gemini";
import { buildPainelSnapshot, DOMINIO_PROMPT } from "@/lib/chat/snapshot";

export const runtime = "nodejs";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBRL(v: number | null | undefined): string {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

interface Intent {
  nome: string;
  match: (q: string) => boolean;
  respond: (ctx: { supabase: SupabaseClient; pergunta: string }) => Promise<string>;
}

const INTENTS: Intent[] = [
  // === SAUDAÇÕES ===
  {
    nome: "saudacao",
    match: (q) =>
      /\b(oi|ola|bom dia|boa tarde|boa noite|eai|hey)\b/.test(q) &&
      q.length < 40,
    respond: async () =>
      "Olá! Sou o assistente do Painel Financeiro. Posso ajudar com cessões, cessionários, pagamentos ou dúvidas de uso. Pergunte o que precisar.",
  },
  {
    nome: "ajuda",
    match: (q) => /\b(ajuda|help|o que voce faz|o que sabe|o que posso)\b/.test(q),
    respond: async () =>
      [
        "Posso responder sobre:",
        "• Quanto você tem a receber / já recebeu",
        "• Quantas cessões ativas / liquidadas / inadimplentes",
        "• Definições: cessão, cessionário, % cedida",
        "• Como cadastrar cliente/cessionário/cessão",
        "• Como gerar PDFs e compartilhar no WhatsApp",
      ].join("\n"),
  },

  // === DADOS: valores e totais ===
  {
    nome: "saldo-a-receber",
    match: (q) =>
      /quanto.*(receber|tenho|falta)|saldo.*receber|a receber/.test(q) &&
      !/por periodo|do mes|deste mes/.test(q),
    respond: async ({ supabase }) => {
      const { data } = await supabase
        .from("v_resumo_geral")
        .select("*")
        .maybeSingle();
      if (!data)
        return "Não consegui ler os totais agora. Tente recarregar o dashboard.";
      return `Você tem ${formatBRL(data.valor_a_receber)} a receber em ${data.qtd_a_receber} cessão${data.qtd_a_receber === 1 ? "" : "ões"} ativa${data.qtd_a_receber === 1 ? "" : "s"}.`;
    },
  },
  {
    nome: "valor-recebido",
    match: (q) =>
      /quanto.*(recebi|ja recebi|recebido|recebeu)|total recebido|valores? recebid/.test(
        q,
      ),
    respond: async ({ supabase }) => {
      const { data } = await supabase
        .from("v_resumo_geral")
        .select("*")
        .maybeSingle();
      if (!data)
        return "Não consegui ler os totais agora. Tente recarregar o dashboard.";
      return `Total recebido até agora: ${formatBRL(data.valor_recebido_total)}. Valor já liquidado (cessões totalmente pagas): ${formatBRL(data.valor_liquidado)}.`;
    },
  },
  {
    nome: "volume-total",
    match: (q) =>
      /volume total|total.*geral|total.*cedido|total.*cessoes/.test(q),
    respond: async ({ supabase }) => {
      const { data } = await supabase
        .from("v_resumo_geral")
        .select("*")
        .maybeSingle();
      if (!data) return "Não consegui ler o volume agora.";
      const totalCessoes =
        Number(data.qtd_liquidadas) +
        Number(data.qtd_a_receber) +
        Number(data.qtd_canceladas);
      return `Volume total de ${formatBRL(data.volume_total)} distribuído em ${totalCessoes} cessão${totalCessoes === 1 ? "" : "ões"} cadastrada${totalCessoes === 1 ? "" : "s"}.`;
    },
  },

  // === CONTAGENS ===
  {
    nome: "quantas-cessoes",
    match: (q) => /quant(as|os).*cess[oa]|numero de cess/.test(q),
    respond: async ({ supabase }) => {
      const { data } = await supabase
        .from("v_resumo_geral")
        .select("*")
        .maybeSingle();
      if (!data) return "Não consegui contar as cessões agora.";
      const total =
        Number(data.qtd_liquidadas) +
        Number(data.qtd_a_receber) +
        Number(data.qtd_canceladas);
      return `Total: ${total} cessão${total === 1 ? "" : "ões"}.\n• ${data.qtd_a_receber} a receber\n• ${data.qtd_liquidadas} liquidada${data.qtd_liquidadas === 1 ? "" : "s"}\n• ${data.qtd_canceladas} cancelada${data.qtd_canceladas === 1 ? "" : "s"}`;
    },
  },
  {
    nome: "cessoes-ativas",
    match: (q) => /cess[oa].*(ativ|em aberto|a receber)/.test(q),
    respond: async ({ supabase }) => {
      const { data } = await supabase
        .from("v_resumo_geral")
        .select("*")
        .maybeSingle();
      if (!data) return "Sem dados no momento.";
      return `${data.qtd_a_receber} cessão${data.qtd_a_receber === 1 ? "" : "ões"} a receber, somando ${formatBRL(data.valor_a_receber)}. Veja em Operação > Cessões (aba "A receber").`;
    },
  },
  {
    nome: "cessoes-liquidadas",
    match: (q) => /cess[oa].*(liquid|quita|paga)/.test(q),
    respond: async ({ supabase }) => {
      const { data } = await supabase
        .from("v_resumo_geral")
        .select("*")
        .maybeSingle();
      if (!data) return "Sem dados no momento.";
      return `${data.qtd_liquidadas} cessão${data.qtd_liquidadas === 1 ? "" : "ões"} já liquidada${data.qtd_liquidadas === 1 ? "" : "s"}, totalizando ${formatBRL(data.valor_liquidado)}. Veja em Operação > Cessões (aba "Liquidadas").`;
    },
  },

  // === INADIMPLÊNCIA ===
  {
    nome: "inadimplencia",
    match: (q) =>
      /inadimpl|atrasad|em atraso|vencid|ned(ev|evido)|devendo/.test(q),
    respond: async ({ supabase }) => {
      const { data, count } = await supabase
        .from("v_inadimplencia")
        .select("cliente_nome, valor", { count: "exact" })
        .order("valor", { ascending: false })
        .limit(5);
      if (count === 0)
        return "✅ Nenhuma parcela em atraso. Carteira em dia!";
      const soma = (data ?? []).reduce(
        (s, r) => s + Number((r as { valor: number }).valor),
        0,
      );
      const top = (data ?? [])
        .slice(0, 3)
        .map(
          (r) =>
            `• ${(r as { cliente_nome: string }).cliente_nome}: ${formatBRL((r as { valor: number }).valor)}`,
        )
        .join("\n");
      return `⚠ ${count} parcela${count === 1 ? "" : "s"} em atraso, total ${formatBRL(soma)} dos 5 maiores.\n\nTop 3:\n${top}\n\nVeja lista completa em Clientes > Clientes (pontinho vermelho).`;
    },
  },

  // === DEFINIÇÕES ===
  {
    nome: "def-cessao",
    match: (q) =>
      /o que (e|eh|significa).*cess[ao]|cess[ao] de credito/.test(q) &&
      !/cessionar/.test(q),
    respond: async () =>
      "**Cessão** é o contrato em que o cliente (cedente) transfere uma fatia do crédito que tem a receber para o cessionário (recebedor). O cessionário passa a ter direito aos pagamentos dessa fatia.",
  },
  {
    nome: "def-cessionario",
    match: (q) => /o que (e|eh|significa).*cessionar/.test(q),
    respond: async () =>
      "**Cessionário** é a pessoa física ou jurídica que COMPRA uma fatia do crédito do cedente. Ele recebe os pagamentos conforme as parcelas da cessão são quitadas.",
  },
  {
    nome: "def-cedente",
    match: (q) => /o que (e|eh|significa).*cedente|cliente principal/.test(q),
    respond: async () =>
      "**Cedente** (ou Cliente Principal) é o titular original do crédito. Ele cede uma porcentagem pra um ou mais cessionários. No nosso caso, o principal é o Sr. Marcos André de Andrade.",
  },
  {
    nome: "def-percentual-cedido",
    match: (q) => /(o que|significa).*(percentual|porcentag).*(ced|cessao)|ced(id|endo)/.test(q),
    respond: async () =>
      "A **% cedida** é a fatia do crédito TOTAL do cedente que foi transferida ao cessionário. Exemplo: 0,028% significa que o cessionário tem direito a apenas 0,028% do crédito total — é uma proporção pequena, não a porcentagem paga vs a receber.",
  },
  {
    nome: "def-liquidada",
    match: (q) => /o que (e|eh|significa).*liquid/.test(q),
    respond: async () =>
      "**Liquidada** é uma cessão em que todas as parcelas foram pagas. O cessionário já recebeu 100% do valor previsto.",
  },

  // === COMO FAZER ===
  {
    nome: "como-cadastrar-cessionario",
    match: (q) =>
      /(como|onde).*(cadastr|criar|novo|adicionar).*(cessionar|recebedor)/.test(
        q,
      ),
    respond: async () =>
      'Menu superior > **Clientes** > **Cessionários** > clique em **"+ Novo cessionário"**. Preencha tipo (PF/PJ), nome, CNPJ/CPF, dados do contrato (data, valor contratado, valor da cessão, % cedida) e dados bancários.',
  },
  {
    nome: "como-cadastrar-cliente",
    match: (q) =>
      /(como|onde).*(cadastr|criar|novo|adicionar).*(cliente|cedente)/.test(q),
    respond: async () =>
      'Menu superior > **Clientes** > **Clientes** > clique em **"+ Novo cliente"**. Preencha nome, CPF/CNPJ, contatos e endereço.',
  },
  {
    nome: "como-cadastrar-cessao",
    match: (q) =>
      /(como|onde).*(cadastr|criar|nov|adicionar).*(cess[ao]|contrato)/.test(q),
    respond: async () =>
      'Menu superior > **Operação** > **Cessões** > clique em **"+ Nova cessão"**. Escolha cliente + cessionário, valor, número de parcelas, data da cessão e 1º vencimento. O sistema gera as parcelas automaticamente.',
  },
  {
    nome: "como-registrar-pagamento",
    match: (q) =>
      /(como|onde).*(registr|marcar|receb).*(pagamento|parcela|pago)/.test(q),
    respond: async () =>
      'Abra a cessão em **Operação > Cessões > [clicar no contrato]**. Role até **"Cronograma de parcelas"** > clique em **"Registrar pagamento"** na parcela. Informe a data e o valor, e opcionalmente faça upload do comprovante.',
  },
  {
    nome: "como-pdf",
    match: (q) => /(como|gerar|imprim|baixar).*(pdf|extrato|relatorio)/.test(q),
    respond: async () =>
      "Na tela do **cliente** ou da **cessão**, há o botão **⬇ Extrato PDF** (dourado). Gera um PDF pronto para imprimir ou compartilhar.",
  },
  {
    nome: "como-whatsapp",
    match: (q) => /(como|enviar|mandar|compartilhar).*(whats|zap)/.test(q),
    respond: async () =>
      "Ao lado do botão **Extrato PDF** tem um botão verde do WhatsApp. Clique e o sistema abre uma conversa com o cliente (se o telefone estiver cadastrado), com o PDF anexo pronto pra enviar.",
  },
  {
    nome: "filtro-dashboard",
    match: (q) =>
      /(filtr|selecion).*(mes|ano|periodo|dashboard)|dashboard.*filtr/.test(q),
    respond: async () =>
      'No topo da **Visão geral** existem 2 dropdowns (Mês e Ano). Selecione para ver só as cessões do período. Deixe em branco pra ver tudo.',
  },
  {
    nome: "filtro-cessionarios",
    match: (q) =>
      /(filtr|buscar).*(cessionar)|cessionar.*(filtr|buscar|periodo)/.test(q),
    respond: async () =>
      'Em **Clientes > Cessionários** tem busca por nome/CPF, filtro de período por **Contrato: Mês + Ano**, abas **Todos / Ativos / Inativos** e colunas ordenáveis (clique no cabeçalho).',
  },

  // === DADOS DEMO ===
  {
    nome: "dados-demo",
    match: (q) => /(demo|fict|teste|popular|limpar).*dado|dado.*demo/.test(q),
    respond: async () =>
      "Acesse **menu do usuário (canto superior direito) > Dados demo**. Tem botões pra popular 6 clientes + 6 cessionários + 10 cessões fictícias (marcador [DEMO]) e apagar tudo depois com 1 clique. Só dados reais permanecem.",
  },

  // === CONTEXTO DO SISTEMA ===
  {
    nome: "sistema-geral",
    match: (q) =>
      /o que (e|eh).*(sistema|painel|app)|para que serve|qual o proposito/.test(q),
    respond: async () =>
      "**Painel Financeiro** da Menezes Advocacia. Gerencia cessões de crédito: cada cliente (cedente) transfere uma porcentagem do seu crédito para cessionários (PF ou PJ). O sistema controla parcelas, pagamentos, inadimplência e gera relatórios/PDFs.",
  },
];

// Fallback: pergunta sobre um nome específico
async function tentarBuscarPorNome(
  supabase: SupabaseClient,
  pergunta: string,
): Promise<string | null> {
  // Extrai palavras significativas (>= 4 letras, não stopwords)
  const stopwords = new Set([
    "quanto",
    "quando",
    "quais",
    "esta",
    "estao",
    "tenho",
    "receber",
    "recebe",
    "pagou",
    "paga",
    "sobre",
    "como",
    "onde",
    "cessionario",
    "cessionarios",
    "cliente",
    "clientes",
    "cessao",
    "cessoes",
    "valor",
    "total",
  ]);
  const palavras = pergunta
    .split(/\s+/)
    .filter((p) => p.length >= 4 && !stopwords.has(p));
  if (palavras.length === 0) return null;

  const termo = palavras.slice(0, 3).join(" "); // combina até 3 palavras como termo
  const [cessionariosRes, clientesRes] = await Promise.all([
    supabase
      .from("cessionarios")
      .select("id, nome, valor_cessao, percentual")
      .ilike("nome", `%${termo}%`)
      .limit(3),
    supabase
      .from("clientes_principais")
      .select("id, nome")
      .ilike("nome", `%${termo}%`)
      .limit(3),
  ]);

  const cessionarios = (cessionariosRes.data ?? []) as {
    id: string;
    nome: string;
    valor_cessao: number | null;
    percentual: number | null;
  }[];
  const clientes = (clientesRes.data ?? []) as { id: string; nome: string }[];

  if (cessionarios.length === 0 && clientes.length === 0) return null;

  const partes: string[] = [];
  if (cessionarios.length > 0) {
    partes.push("**Cessionários encontrados:**");
    for (const c of cessionarios) {
      partes.push(
        `• ${c.nome}${c.valor_cessao != null ? ` — cessão de ${formatBRL(c.valor_cessao)}` : ""}${c.percentual != null ? ` (${c.percentual}% cedida)` : ""}`,
      );
    }
    partes.push(
      "→ Abra em **Clientes > Cessionários** e clique em Detalhes.",
    );
  }
  if (clientes.length > 0) {
    if (partes.length > 0) partes.push("");
    partes.push("**Clientes encontrados:**");
    for (const c of clientes) {
      partes.push(`• ${c.nome}`);
    }
    partes.push("→ Abra em **Clientes > Clientes** e clique em Detalhes.");
  }
  return partes.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages: Msg[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (messages.length === 0) {
      return Response.json(
        { error: "Nenhuma mensagem enviada." },
        { status: 400 },
      );
    }

    const ultima = messages[messages.length - 1];
    if (ultima.role !== "user") {
      return Response.json(
        { error: "Última mensagem deve ser do usuário." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const perguntaNorm = normalize(ultima.content);

    // Tenta matchers fixos (fast path — resposta instantânea, zero tokens)
    for (const intent of INTENTS) {
      if (intent.match(perguntaNorm)) {
        const reply = await intent.respond({ supabase, pergunta: perguntaNorm });
        return Response.json({ reply, intent: intent.nome, source: "local" });
      }
    }

    // Fallback 1: Gemini com snapshot completo do painel
    if (isGeminiEnabled()) {
      try {
        const snapshot = await buildPainelSnapshot(supabase);
        const systemInstruction = `${DOMINIO_PROMPT}\n\n# Snapshot atual do painel\n\n${snapshot}`;
        const reply = await askGemini(messages, systemInstruction);
        if (reply) {
          return Response.json({ reply, intent: "gemini", source: "gemini" });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[chat] gemini falhou, caindo para fallback:", msg);
      }
    }

    // Fallback 2: busca por nome no banco
    const porNome = await tentarBuscarPorNome(supabase, perguntaNorm);
    if (porNome)
      return Response.json({
        reply: porNome,
        intent: "busca-nome",
        source: "local",
      });

    // Último fallback: resposta genérica com sugestões
    return Response.json({
      reply: [
        "Não entendi bem sua pergunta. Experimente:",
        "• \"Quanto tenho a receber?\"",
        "• \"Quantas cessões ativas?\"",
        "• \"Tem cliente inadimplente?\"",
        "• \"Como cadastro um cessionário?\"",
        "• \"O que é % cedida?\"",
        "",
        "Ou digite o nome de um cliente/cessionário pra buscar.",
      ].join("\n"),
      intent: "fallback",
      source: "local",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[chat] erro:", msg);
    return Response.json(
      { error: `Erro no assistente: ${msg}` },
      { status: 500 },
    );
  }
}
