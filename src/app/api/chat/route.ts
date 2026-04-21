import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_BASE = `Voce e o assistente do Painel Financeiro da Menezes Advocacia.
Seu publico e o Dr. Jairo Menezes e a equipe do escritorio.

DOMINIO DO SISTEMA — termos juridico-financeiros:
- Cliente principal (cedente): titular original do credito, geralmente o Sr. Marcos Andre de Andrade ou outros clientes do escritorio
- Cessionario: pessoa fisica ou juridica que COMPRA uma fatia do credito do cedente
- Cessao: contrato em que o cedente transfere uma porcentagem do credito ao cessionario
- % Cedida: fracao do credito total que o cedente transferiu (ex: 0,028% e uma proporcao PEQUENA do todo)
- Liquidada: cessao totalmente paga (todas parcelas quitadas)
- A receber: cessao com parcelas ainda nao pagas
- Inadimplente: parcelas vencidas e nao pagas
- Cancelada: cessao desfeita antes da conclusao

FLUXOS PRINCIPAIS NO SISTEMA:
- Visao geral: /dashboard — KPIs (Saldo a receber / Valores recebidos / Valor a receber), contadores, grafico mensal, pizza liquidadas vs a receber. Tem filtro por Mes/Ano
- Menu "Clientes" -> Clientes (cedentes) | Cessionarios (recebedores)
- Menu "Operacao" -> Cessoes | Pagamentos | Agenda
- Relatorios: /dashboard/relatorios
- Area admin (so para role admin): Usuarios, Portal do contador, Importar CSV, Logs, Configuracoes, Dados demo

COMO USAR (respostas rapidas):
- Cadastrar novo cessionario: menu Clientes -> Cessionarios -> botao "+ Novo cessionario"
- Cadastrar nova cessao: menu Operacao -> Cessoes -> botao "+ Nova cessao"
- Registrar pagamento de parcela: abrir a cessao em /dashboard/cessoes/[id] -> "Registrar pagamento" na parcela
- Gerar PDF de extrato: na tela do cliente, botao "Extrato PDF"
- Compartilhar PDF no WhatsApp: botao verde ao lado do "Extrato PDF"
- Filtrar cessionarios por data: dropdowns Mes + Ano no topo da listagem
- Popular dados ficticios para testes: admin -> Dados demo -> "Popular dados demo"

REGRAS DE RESPOSTA:
- Responda SEMPRE em portugues do Brasil, com acentuacao completa.
- Seja direto e curto (maximo 3-4 linhas, salvo se a pergunta pedir explicacao detalhada).
- Use linguagem acessivel ao Dr. Jairo — ele e advogado, nao tecnico.
- Se nao souber algo especifico sobre o banco de dados atual (ex: "quanto o cessionario X tem em aberto?"), diga que ele pode conferir na tela de detalhes do cessionario.
- Sugira caminhos de menu quando aplicavel (ex: "va em Clientes > Cessionarios").
- Nao invente dados. Se o contexto abaixo nao tiver a resposta, oriente onde achar.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "Assistente nao configurado. Peca ao admin para cadastrar ANTHROPIC_API_KEY no Vercel.",
        },
        { status: 503 },
      );
    }

    const body = (await req.json()) as { messages: Msg[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return Response.json({ error: "Nenhuma mensagem enviada." }, { status: 400 });
    }

    // Busca contexto do banco (totais resumidos) para enriquecer o prompt
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const [resumoRes, inadCount] = await Promise.all([
      supabase.from("v_resumo_geral").select("*").maybeSingle(),
      supabase
        .from("v_inadimplencia")
        .select("pagamento_id", { count: "exact", head: true }),
    ]);

    const resumo = resumoRes.data as Record<string, number> | null;
    const parcelasVencidas = inadCount.count ?? 0;

    const contextoDados = resumo
      ? `\n\nDADOS ATUAIS DO SISTEMA (para voce responder perguntas de resumo):
- Cessoes liquidadas: ${resumo.qtd_liquidadas}
- Cessoes a receber: ${resumo.qtd_a_receber}
- Cessoes canceladas: ${resumo.qtd_canceladas}
- Valor liquidado (total ja recebido em cessoes quitadas): R$ ${Number(resumo.valor_liquidado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Valor a receber (saldo pendente das cessoes ativas): R$ ${Number(resumo.valor_a_receber).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Volume total (soma de todas cessoes): R$ ${Number(resumo.volume_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Parcelas vencidas e nao pagas: ${parcelasVencidas}`
      : "";

    const anthropic = new Anthropic({ apiKey });

    const resp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_BASE + contextoDados,
      messages: messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content })),
    });

    const texto =
      resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n") || "Nao consegui gerar uma resposta.";

    return Response.json({ reply: texto });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[chat] erro:", msg);
    return Response.json({ error: `Erro no assistente: ${msg}` }, { status: 500 });
  }
}
