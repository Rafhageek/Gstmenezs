import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/feedback";
import { FluxoMensalChart } from "@/components/charts/fluxo-mensal-chart";
import { CessoesPizzaChart } from "@/components/charts/cessoes-pizza-chart";
import { CessaoProgressoPizza } from "@/components/charts/cessao-progresso-pizza";
import { SessoesLiquidadas } from "@/components/dashboard/sessoes-liquidadas";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL } from "@/lib/format";
import type {
  CessaoResumo,
  FluxoMensal,
  InadimplenciaItem,
  ComparativoMes,
  CessaoLiquidada,
  ResumoGeral,
} from "@/types/database";

export const metadata = {
  title: "Visão geral — Painel MNZ",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    cessoesRes,
    fluxoRes,
    inadRes,
    compRes,
    liquidadasRes,
    resumoRes,
  ] = await Promise.all([
    supabase
      .from("v_cessoes_resumo")
      .select("*")
      .order("data_vencimento_inicial", { ascending: true })
      .returns<CessaoResumo[]>(),
    supabase.from("v_fluxo_mensal").select("*").returns<FluxoMensal[]>(),
    supabase
      .from("v_inadimplencia")
      .select("*")
      .returns<InadimplenciaItem[]>(),
    supabase
      .from("v_comparativo_mes")
      .select("*")
      .maybeSingle<ComparativoMes>(),
    supabase
      .from("v_cessoes_liquidadas")
      .select("*")
      .returns<CessaoLiquidada[]>(),
    supabase.from("v_resumo_geral").select("*").maybeSingle<ResumoGeral>(),
  ]);

  if (cessoesRes.error) {
    return <SchemaPendente erro={cessoesRes.error.message} />;
  }

  const cessoes = cessoesRes.data ?? [];
  const fluxo = fluxoRes.data ?? [];
  const inadimplentes = inadRes.data ?? [];
  const comparativo = compRes.data;
  const liquidadas = liquidadasRes.data ?? [];
  const resumoGeral = resumoRes.data;

  const cessoesAtivas = cessoes.filter((c) => c.status !== "quitada");
  const valorLiquidado = liquidadas.reduce(
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

  // Pizza por status (top 6 cessões por valor)
  const topCessoes = [...cessoes]
    .sort((a, b) => Number(b.valor_total) - Number(a.valor_total))
    .slice(0, 6)
    .map((c) => ({
      name: `${c.numero_contrato} — ${truncate(c.cliente_nome, 18)}`,
      value: Number(c.valor_total),
    }));

  const graficoGeral = [
    { name: "A receber", value: Number(resumoGeral?.valor_a_receber ?? totais.saldo) },
    { name: "Liquidadas", value: Number(resumoGeral?.valor_liquidado ?? valorLiquidado) },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Visão geral
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Painel financeiro consolidado de todas as cessões de crédito.
        </p>
      </header>

      {/* Sessoes liquidadas — topo */}
      <section className="mb-6">
        <SessoesLiquidadas cessoes={liquidadas} valorTotal={valorLiquidado} />
      </section>

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

      {/* Pizza cessões — geral (liquidadas vs a receber) + top 6 */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CessoesPizzaChart
          titulo="Visão geral"
          subtitulo={`${resumoGeral?.qtd_liquidadas ?? liquidadas.length} liquidada${
            (resumoGeral?.qtd_liquidadas ?? liquidadas.length) === 1 ? "" : "s"
          } · ${resumoGeral?.qtd_a_receber ?? cessoesAtivas.length} a receber`}
          data={graficoGeral}
          colors={["#c9a961", "#10b981"]}
        />
        <CessoesPizzaChart
          titulo="Maiores cessões"
          subtitulo="Top 6 por volume"
          data={topCessoes}
        />
      </section>

      {/* Lista de cessões a receber — quitadas aparecem em "Sessoes Liquidadas" no topo */}
      <section className="mt-10">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Cessões a receber ({cessoesAtivas.length})
          </h2>
          <Link
            href="/dashboard/cessoes"
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Gerenciar →
          </Link>
        </header>

        {cessoesAtivas.length === 0 ? (
          <EmptyState tipo="cessoes" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
            <table className="w-full text-sm">
              <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Progresso</th>
                  <th className="px-4 py-3 font-medium">Contrato</th>
                  <th className="px-4 py-3 font-medium">Cliente / Cessionário</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Pago</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cessoesAtivas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--border)] hover:bg-black/20"
                  >
                    <td className="px-4 py-3">
                      <CessaoProgressoPizza
                        valorPago={Number(c.valor_pago)}
                        saldoDevedor={Number(c.saldo_devedor)}
                        size={56}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/dashboard/cessoes/${c.id}`}
                        className="text-[var(--gold)] hover:underline"
                      >
                        {c.numero_contrato}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.cliente_nome}</div>
                      <div className="text-xs text-[var(--muted)]">
                        → {c.cessionario_nome}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatBRL(c.valor_total)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--success)]">
                      {formatBRL(c.valor_pago)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={c.status}
                        atrasado={!!c.primeira_parcela_atrasada}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
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

function StatusBadge({
  status,
  atrasado,
}: {
  status: CessaoResumo["status"];
  atrasado: boolean;
}) {
  if (atrasado && status === "ativa") {
    return <Badge variant="warning">A receber (vencida)</Badge>;
  }
  const map: Record<CessaoResumo["status"], React.ReactNode> = {
    ativa: <Badge variant="gold">A receber</Badge>,
    quitada: <Badge variant="success">Liquidada</Badge>,
    inadimplente: <Badge variant="danger">Inadimplente</Badge>,
    cancelada: <Badge variant="neutral">Cancelada</Badge>,
  };
  return map[status];
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
