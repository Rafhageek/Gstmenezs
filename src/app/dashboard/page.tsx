import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FluxoMensalChart } from "@/components/charts/fluxo-mensal-chart";
import { CessoesPizzaChart } from "@/components/charts/cessoes-pizza-chart";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { MonthYearFilter } from "@/components/ui/month-year-filter";
import { AssistenteWidget } from "@/components/dashboard/assistente-widget";
import { PrintButton } from "@/components/print-button";
import { formatBRL, formatDataBR } from "@/lib/format";
import type {
  CessaoResumo,
  FluxoMensal,
  InadimplenciaItem,
  ComparativoMes,
  ResumoGeral,
  ParcelaProxima,
} from "@/types/database";


export const metadata = {
  title: "Visão geral — Painel Financeiro",
};

const MESES_NOMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ultimoDiaMes(ano: number, mes: number): string {
  const d = new Date(ano, mes, 0);
  return `${ano}-${pad2(mes)}-${pad2(d.getDate())}`;
}

interface DashboardSP {
  mes?: string;
  ano?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSP>;
}) {
  const sp = await searchParams;
  const mesNum = sp.mes ? Number(sp.mes) : null;
  const anoNum = sp.ano ? Number(sp.ano) : null;

  // Calcula range de filtro por data_cessao
  let dataDe: string | null = null;
  let dataAte: string | null = null;
  let labelPeriodo: string | null = null;

  if (anoNum && mesNum) {
    dataDe = `${anoNum}-${pad2(mesNum)}-01`;
    dataAte = ultimoDiaMes(anoNum, mesNum);
    labelPeriodo = `${MESES_NOMES[mesNum - 1]}/${anoNum}`;
  } else if (anoNum) {
    dataDe = `${anoNum}-01-01`;
    dataAte = `${anoNum}-12-31`;
    labelPeriodo = `Ano ${anoNum}`;
  }

  const supabase = await createClient();

  let cessoesQuery = supabase
    .from("v_cessoes_resumo")
    .select("*")
    .order("data_vencimento_inicial", { ascending: true });

  if (dataDe) cessoesQuery = cessoesQuery.gte("data_cessao", dataDe);
  if (dataAte) cessoesQuery = cessoesQuery.lte("data_cessao", dataAte);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    cessoesRes,
    fluxoRes,
    inadRes,
    compRes,
    resumoRes,
    proximasRes,
  ] = await Promise.all([
    cessoesQuery.returns<CessaoResumo[]>(),
    supabase.from("v_fluxo_mensal").select("*").returns<FluxoMensal[]>(),
    supabase
      .from("v_inadimplencia")
      .select("*")
      .order("valor", { ascending: false })
      .returns<InadimplenciaItem[]>(),
    supabase
      .from("v_comparativo_mes")
      .select("*")
      .maybeSingle<ComparativoMes>(),
    supabase.from("v_resumo_geral").select("*").maybeSingle<ResumoGeral>(),
    supabase
      .from("v_parcelas_proximas")
      .select("*")
      .lte("dias_ate_vencer", 7)
      .order("dias_ate_vencer", { ascending: true })
      .returns<ParcelaProxima[]>(),
  ]);

  if (cessoesRes.error) {
    return <SchemaPendente erro={cessoesRes.error.message} />;
  }

  const cessoes = cessoesRes.data ?? [];
  const fluxo = fluxoRes.data ?? [];
  const inadimplentes = inadRes.data ?? [];
  const comparativo = compRes.data;
  const resumoGeral = resumoRes.data;
  const proximas = proximasRes.data ?? [];

  const cessoesAtivas = cessoes.filter((c) => c.status !== "quitada");
  const liquidadasNoFiltro = cessoes.filter((c) => c.status === "quitada");
  const valorLiquidado = liquidadasNoFiltro.reduce(
    (sum, c) => sum + Number(c.valor_total),
    0,
  );

  const totais = cessoes.reduce(
    (acc, c) => {
      acc.total += Number(c.valor_total);
      acc.pago += Number(c.valor_pago);
      acc.saldo += Number(c.saldo_devedor);
      return acc;
    },
    { total: 0, pago: 0, saldo: 0 },
  );

  const valorAtrasado = inadimplentes.reduce(
    (sum, i) => sum + Number(i.valor),
    0,
  );

  // Contadores por status (para o card "Quantidade de cessões")
  const contadores = {
    ativas: cessoes.filter((c) => c.status === "ativa").length,
    pagas: cessoes.filter((c) => c.status === "quitada").length,
    inadimplentes: cessoes.filter(
      (c) => c.status === "inadimplente" || !!c.primeira_parcela_atrasada,
    ).length,
    canceladas: cessoes.filter((c) => c.status === "cancelada").length,
  };

  const graficoGeral = [
    { name: "A receber", value: Number(resumoGeral?.valor_a_receber ?? totais.saldo) },
    { name: "Liquidadas", value: Number(resumoGeral?.valor_liquidado ?? valorLiquidado) },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
          Visão geral
        </p>
        {labelPeriodo && (
          <p className="mt-2 text-sm text-[var(--gold)]">
            Filtrado por: <strong>{labelPeriodo}</strong>
          </p>
        )}
        <FiltrosRapidos current={{ mes: sp.mes, ano: sp.ano }} />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <MonthYearFilter label="Período" />
          <PrintButton label="Imprimir / PDF" />
        </div>
      </header>


      {/* 3 KPIs na mesma simetria (Saldo a receber | Valores recebidos | Valor a receber) */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiAnimado
          label="Saldo a receber"
          value={totais.saldo}
          accent="gold"
          sub={`${cessoesAtivas.length} cessão${cessoesAtivas.length === 1 ? "" : "ões"} a receber · ${formatBRL(totais.total)} volume total`}
        />
        <KpiAnimado
          label="Valores recebidos"
          value={totais.pago}
          accent="success"
          sub={
            comparativo
              ? `Este mês: ${formatBRL(comparativo.mes_atual)}`
              : undefined
          }
        />
        <KpiAnimado
          label="Valor a receber"
          value={valorAtrasado}
          accent={valorAtrasado > 0 ? "warning" : "muted"}
          sub={`${inadimplentes.length} parcela${inadimplentes.length === 1 ? "" : "s"} pendente${inadimplentes.length === 1 ? "" : "s"}`}
        />
      </section>

      {/* Meus contratos (contadores) */}
      <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
        <header className="mb-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Meus contratos
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]/70">
              Total de {cessoes.length} contrato
              {cessoes.length === 1 ? "" : "s"} cadastrado
              {cessoes.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/dashboard/cessoes"
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Ver todos →
          </Link>
        </header>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Contador
            label="Ativos"
            value={contadores.ativas}
            href="/dashboard/cessoes?status=ativa"
            accent="gold"
          />
          <Contador
            label="Liquidados"
            value={contadores.pagas}
            href="/dashboard/cessoes?filtro=liquidadas"
            accent="success"
          />
          <Contador
            label="Inadimplentes"
            value={contadores.inadimplentes}
            href="/dashboard/cessoes?status=inadimplente"
            accent="danger"
          />
          <Contador
            label="Cancelados"
            value={contadores.canceladas}
            href="/dashboard/cessoes?status=cancelada"
            accent="muted"
          />
        </div>
      </section>

      {/* Card de acao do dia — Vence esta semana */}
      <section className="mt-6">
        <VenceSemanaCard proximas={proximas} />
      </section>

      {/* Pizza + Assistente IA lado a lado */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CessoesPizzaChart
          subtitulo={`${resumoGeral?.qtd_liquidadas ?? liquidadasNoFiltro.length} liquidada${
            (resumoGeral?.qtd_liquidadas ?? liquidadasNoFiltro.length) === 1 ? "" : "s"
          } · ${resumoGeral?.qtd_a_receber ?? cessoesAtivas.length} a receber`}
          data={graficoGeral}
          colors={["#c9a961", "#10b981"]}
          itemHrefs={graficoGeral.map((d) =>
            d.name === "A receber"
              ? "/dashboard/cessoes?status=ativa"
              : "/dashboard/cessoes?filtro=liquidadas",
          )}
        />
        <div data-no-print>
          <AssistenteWidget />
        </div>
      </section>

      {/* Gráfico fluxo mensal (Aging removido a pedido do cliente) */}
      <section className="mt-6">
        <FluxoMensalChart data={fluxo} />
      </section>
    </div>
  );
}

function FiltrosRapidos({
  current,
}: {
  current: { mes?: string; ano?: string };
}) {
  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1);
  const anoAtual = String(hoje.getFullYear());

  const isTudo = !current.mes && !current.ano;
  const isEsteMes = current.mes === mesAtual && current.ano === anoAtual;
  const isEsteAno = !current.mes && current.ano === anoAtual;

  const chips = [
    { label: "Tudo", href: "/dashboard", active: isTudo },
    {
      label: "Este mês",
      href: `/dashboard?mes=${mesAtual}&ano=${anoAtual}`,
      active: isEsteMes,
    },
    {
      label: "Este ano",
      href: `/dashboard?ano=${anoAtual}`,
      active: isEsteAno,
    },
  ];

  return (
    <nav
      data-no-print
      className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
    >
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
            c.active
              ? "bg-[var(--gold)] text-[var(--background)]"
              : "border border-[var(--border)] bg-black/20 text-[var(--muted)] hover:border-[var(--gold)]/50 hover:text-foreground"
          }`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}

function VenceSemanaCard({ proximas }: { proximas: ParcelaProxima[] }) {
  const top = proximas.slice(0, 5);
  const total = proximas.reduce((s, p) => s + Number(p.valor), 0);

  return (
    <article className="rounded-xl border border-[var(--gold)]/30 bg-[var(--background-elevated)] p-5">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
            Vence esta semana
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]/70">
            Próximos 7 dias · {formatBRL(total)} em {proximas.length}{" "}
            parcela{proximas.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {top.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
          <p className="text-xs text-[var(--muted)]">
            Nenhum vencimento nos próximos 7 dias.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {top.map((p) => (
            <li key={p.pagamento_id}>
              <Link
                href={`/dashboard/cessoes/${p.cessao_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 transition-colors hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.cliente_nome}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    Parc. {p.numero_parcela} ·{" "}
                    {p.dias_ate_vencer === 0
                      ? "Vence hoje"
                      : `em ${p.dias_ate_vencer} dia${p.dias_ate_vencer === 1 ? "" : "s"}`}{" "}
                    · {formatDataBR(p.data_vencimento)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm text-[var(--gold)]">
                    {formatBRL(p.valor)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {proximas.length > top.length && (
        <Link
          href="/dashboard/agenda"
          className="mt-3 block text-center text-xs text-[var(--gold)] hover:underline"
        >
          Ver todas ({proximas.length}) →
        </Link>
      )}
    </article>
  );
}

function Contador({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent: "gold" | "success" | "danger" | "muted";
}) {
  const colorMap = {
    gold: "text-[var(--gold)] border-[var(--gold)]/30",
    success: "text-[var(--success)] border-[var(--success)]/30",
    danger: "text-[var(--danger)] border-[var(--danger)]/30",
    muted: "text-[var(--muted)] border-[var(--border)]",
  };
  return (
    <Link
      href={href}
      className={`rounded-lg border ${colorMap[accent]} bg-black/20 px-4 py-3 transition-colors hover:bg-black/40`}
    >
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold font-mono ${colorMap[accent].split(" ")[0]}`}>
        {value}
      </p>
    </Link>
  );
}

function KpiAnimado({
  label,
  value,
  sub,
  accent = "muted",
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: "muted" | "gold" | "success" | "danger" | "warning";
}) {
  const colorMap = {
    muted: "text-foreground",
    gold: "text-[var(--gold)]",
    success: "text-[var(--success)]",
    danger: "text-[var(--danger)]",
    warning: "text-[var(--warning)]",
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5 transition-colors hover:border-[var(--gold)]/30">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${colorMap[accent]}`}>
        <AnimatedCounter value={value} format="brl" className="font-mono" />
      </p>
      {sub && (
        <p className="mt-1 text-xs text-[var(--muted)]/70">{sub}</p>
      )}
    </div>
  );
}


function SchemaPendente({ erro }: { erro: string }) {
  return (
    <div className="rounded-xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-6">
      <p className="text-xs uppercase tracking-wide text-[var(--warning)]">
        Schema pendente
      </p>
      <h2 className="mt-2 text-lg font-semibold">
        As tabelas/views do banco ainda não foram criadas
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Aplique as migrations em ordem (
        <code className="font-mono">0001</code>,{" "}
        <code className="font-mono">0002</code>,{" "}
        <code className="font-mono">0003</code>
        ) no painel do Supabase (SQL Editor).
      </p>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Detalhes: <span className="font-mono">{erro}</span>
      </p>
    </div>
  );
}
