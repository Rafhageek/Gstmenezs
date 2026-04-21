import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Ajuda — Painel Financeiro",
};

interface Cenario {
  id: string;
  titulo: string;
  descricao: string;
  passos: (string | { tipo: "caminho"; valor: string })[];
  observacao?: string;
}

const CENARIOS: Cenario[] = [
  {
    id: "visao-geral",
    titulo: "1. Ver a situação geral da carteira",
    descricao:
      "Fluxo de abertura do sistema: como está o financeiro agora, quanto entrou, quanto falta.",
    passos: [
      "Faça login.",
      "Você cai direto na Visão geral.",
      "No topo: 3 KPIs grandes (saldo a receber, valores recebidos, a receber atrasado).",
      "Contadores coloridos de cessões (ativas, liquidadas, inadimplentes, canceladas). Cada um é clicável.",
      "Pizza à esquerda e Assistente IA à direita. Gráfico de fluxo mensal embaixo.",
      "Para filtrar por período, use os dropdowns Mês/Ano logo abaixo do título.",
    ],
  },
  {
    id: "novo-cliente",
    titulo: "2. Cadastrar um cliente (cedente)",
    descricao:
      "Cliente é o titular original do crédito — quem cede uma porcentagem para os cessionários.",
    passos: [
      { tipo: "caminho", valor: "Clientes → Clientes → + Novo cliente" },
      "Preencha nome, CPF ou CNPJ, contatos, endereço.",
      "Observações internas são opcionais.",
      'Clique "Salvar" no final.',
    ],
  },
  {
    id: "novo-cessionario",
    titulo: "3. Cadastrar um cessionário (recebedor)",
    descricao:
      "Cessionário é quem compra uma fatia do crédito do cliente e recebe os pagamentos dessa fatia.",
    passos: [
      { tipo: "caminho", valor: "Clientes → Cessionários → + Novo cessionário" },
      "Tipo: PF (pessoa física) ou PJ (pessoa jurídica).",
      "Dados do contrato: data, valor contratado, valor da cessão, porcentagem cedida.",
      "Dados bancários para os pagamentos (opcional, mas recomendado).",
      'Clique "Salvar".',
    ],
  },
  {
    id: "nova-cessao",
    titulo: "4. Criar um novo contrato de cessão (escritura)",
    descricao:
      "Relaciona um cliente (cedente) a um cessionário (recebedor) com valor, parcelas e prazo.",
    passos: [
      "Acesse um cessionário ou cliente já cadastrado.",
      "Ou use o assistente IA da Visão geral: pergunte 'como cadastro uma cessão?'.",
      "Escolha cliente + cessionário + valor total + número de parcelas + data da 1ª parcela.",
      "O sistema gera o cronograma de parcelas automaticamente.",
    ],
    observacao:
      "Você pode chamar esse documento de contrato, cessão ou escritura — são sinônimos no sistema.",
  },
  {
    id: "registrar-pagamento",
    titulo: "5. Registrar um pagamento recebido",
    descricao:
      "Quando o cliente paga uma parcela, registre pra atualizar o saldo automaticamente.",
    passos: [
      { tipo: "caminho", valor: "Clientes → Clientes → clique no cliente" },
      'Na tabela "Cessões deste cliente", clique em "Abrir" no contrato.',
      'Role até "Cronograma de parcelas".',
      'Clique em "Registrar pagamento" na parcela que foi paga.',
      "Informe data do pagamento e valor.",
      "Opcional: faça upload do comprovante.",
      'Clique "Salvar".',
    ],
    observacao:
      "O sistema atualiza saldo, status, gráficos e notificações automaticamente.",
  },
  {
    id: "pdf-whatsapp",
    titulo: "6. Enviar extrato pro cliente (PDF ou WhatsApp)",
    descricao:
      "Gera um extrato consolidado pronto para imprimir ou mandar por WhatsApp.",
    passos: [
      { tipo: "caminho", valor: "Clientes → Clientes → clique no cliente" },
      "No topo da página, dois botões:",
      "• Extrato PDF (dourado) — baixa ou abre o arquivo.",
      "• WhatsApp (verde) — abre conversa direta com o cliente, com o PDF anexo.",
    ],
    observacao:
      "O botão WhatsApp só funciona se o telefone do cliente estiver cadastrado corretamente.",
  },
  {
    id: "inadimplencia",
    titulo: "7. Identificar e cobrar inadimplência",
    descricao: "Três caminhos diferentes para achar quem está atrasado.",
    passos: [
      "Sino no topo direito: mostra parcelas próximas e já vencidas.",
      'Visão geral: contador vermelho "Inadimplentes" — clique para abrir a lista.',
      "Lista de clientes: quem tem bolinha vermelha do lado do nome está em atraso.",
      "Ao abrir um cliente inadimplente, um alerta vermelho aparece no topo com o número de parcelas.",
    ],
  },
  {
    id: "busca-rapida",
    titulo: "8. Achar alguém rápido",
    descricao: "Atalho global que busca em todo o sistema.",
    passos: [
      "No topo direito, campo de busca com ícone de lupa.",
      "Ou use o atalho de teclado (procure o ícone do Command Palette no header).",
      "Busca por nome, CPF, CNPJ em clientes, cessionários e contratos.",
    ],
  },
  {
    id: "assistente-ia",
    titulo: "9. Usar o Assistente IA do Dashboard",
    descricao:
      "Widget da Visão geral onde você pergunta em linguagem natural e ele consulta os dados.",
    passos: [
      "Na Visão geral, o widget está ao lado da pizza.",
      "Digite a pergunta ou use um dos botões de sugestão.",
      "Exemplos: 'Quanto tenho a receber?', 'Tem cliente atrasado?', 'Me resume a situação'.",
      "Respostas do assistente avançado vêm com selo '✦ via Gemini'.",
    ],
    observacao:
      "O assistente responde sobre dados do painel. Não pede dados sensíveis como senhas.",
  },
  {
    id: "relatorios",
    titulo: "10. Exportar relatórios",
    descricao: "Gera CSVs de cessões, pagamentos e extratos consolidados.",
    passos: [
      { tipo: "caminho", valor: "Menu superior → Relatórios" },
      "Escolha o tipo de relatório.",
      "Aplique filtros (período, cliente, status).",
      "Clique em exportar — baixa um arquivo pronto para Excel.",
    ],
  },
];

export default function AjudaPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Manual de uso"
        titulo="Ajuda"
        descricao="Guia rápido de como usar o Painel Financeiro no dia a dia."
      />

      <nav className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
        <p className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">
          Sumário
        </p>
        <ul className="grid grid-cols-1 gap-1.5 text-sm md:grid-cols-2">
          {CENARIOS.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className="text-[var(--gold)] hover:underline"
              >
                {c.titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        {CENARIOS.map((c) => (
          <section
            key={c.id}
            id={c.id}
            className="scroll-mt-20 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6"
          >
            <h2 className="text-lg font-semibold">{c.titulo}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{c.descricao}</p>

            <ol className="mt-4 space-y-2 text-sm">
              {c.passos.map((p, i) =>
                typeof p === "string" ? (
                  <li
                    key={i}
                    className="flex gap-3 leading-relaxed"
                  >
                    <span className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{p}</span>
                  </li>
                ) : (
                  <li key={i} className="pl-5">
                    <code className="rounded border border-[var(--gold)]/30 bg-black/30 px-2 py-1 font-mono text-xs text-[var(--gold)]">
                      {p.valor}
                    </code>
                  </li>
                ),
              )}
            </ol>

            {c.observacao && (
              <p className="mt-4 rounded-lg border border-[var(--border)] bg-black/20 p-3 text-xs text-[var(--muted)]">
                <strong className="text-foreground">Dica:</strong> {c.observacao}
              </p>
            )}
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-[var(--gold)]/30 bg-[var(--background-elevated)] p-6 text-center">
        <p className="text-sm text-[var(--muted)]">
          Não encontrou o que procurava? Use o Assistente IA da{" "}
          <Link href="/dashboard" className="text-[var(--gold)] hover:underline">
            Visão geral
          </Link>{" "}
          — ele responde perguntas em linguagem natural sobre o sistema.
        </p>
      </section>
    </div>
  );
}
