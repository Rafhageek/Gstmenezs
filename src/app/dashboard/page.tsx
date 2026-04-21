import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FluxoMensalChart } from "@/components/charts/fluxo-mensal-chart";
import { CessoesPizzaChart } from "@/components/charts/cessoes-pizza-chart";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { MonthYearFilter } from "@/components/ui/month-year-filter";
import { AssistenteWidget } from "@/components/dashboard/assistente-widget";
import { formatBRL } from "@/lib/format";
import type {
  CessaoResumo,
  FluxoMensal,
  InadimplenciaItem,
  ComparativoMes,
  ResumoGeral,
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

  const [
    cessoesRes,
    fluxoRes,
    inadRes,
    compRes,
    resumoRes,
  ] = await Promise.all([
    cessoesQuery.returns<CessaoResumo[]>(),
    supabase.from("v_fluxo_mensal").select("*").returns<FluxoMensal[]>(),
    supabase
      .from("v_inadimplencia")
      .select("*")
      .returns<InadimplenciaItem[]>(),
    supabase
      .from("v_comparativo_mes")
      .select("*")
      .maybeSingle<ComparativoMes>(),
    supabase.from("v_resumo_geral").select("*").maybeSingle<ResumoGeral>(),
  ]);

  if (cessoesRes.error) {
    return <SchemaPendente erro={cessoesRes.error.message} />;
  }

  const cessoes = cessoesRes.data ?? [];
  const fluxo = fluxoRes.data ?? [];
  const inadimplentes = inadRes.data ?? [];
  const comparativo = compRes.data;
  const resumoGeral = resumoRes.data;

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
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Visão geral
        </h1>
        {labelPeriodo && (
          <p className="mt-2 text-sm text-[var(--gold)]">
            Filtrado por: <strong>{labelPeriodo}</strong>
          </p>
        )}
        <div className="mt-5 flex justify-center">
          <MonthYearFilter label="Período" />
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

      {/* Quantidade de cessões (contadores) */}
      <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
        <header className="mb-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Quantidade de cessões
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]/70">
              Total de {cessoes.length} cessão
              {cessoes.length === 1 ? "" : "ões"} cadastrada
              {cessoes.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/dashboard/cessoes"
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Ver cessões →
          </Link>
        </header>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Contador
            label="Ativas"
            value={contadores.ativas}
            href="/dashboard/cessoes?status=ativa"
            accent="gold"
          />
          <Contador
            label="Liquidadas"
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
            label="Canceladas"
            value={contadores.canceladas}
            href="/dashboard/cessoes?status=cancelada"
            accent="muted"
          />
        </div>
      </section>

      {/* Gráfico fluxo mensal (Aging removido a pedido do cliente) */}
      <section className="mt-8">
        <FluxoMensalChart data={fluxo} />
      </section>

      {/* Pizza + Assistente IA lado a lado */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CessoesPizzaChart
          subtitulo={`${resumoGeral?.qtd_liquidadas ?? liquidadasNoFiltro.length} liquidada${
            (resumoGeral?.qtd_liquidadas ?? liquidadasNoFiltro.length) === 1 ? "" : "s"
          } · ${resumoGeral?.qtd_a_receber ?? cessoesAtivas.length} a receber`}
          data={graficoGeral}
          colors={["#c9a961", "#10b981"]}
        />
        <AssistenteWidget />
      </section>
    </div>
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
