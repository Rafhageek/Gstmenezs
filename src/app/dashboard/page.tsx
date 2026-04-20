import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/feedback";
import { FluxoMensalChart } from "@/components/charts/fluxo-mensal-chart";
import { CessoesPizzaChart } from "@/components/charts/cessoes-pizza-chart";
import { CessaoProgressoPizza } from "@/components/charts/cessao-progresso-pizza";
import { AgingBuckets } from "@/components/dashboard/aging-buckets";
import { KpiPrimary } from "@/components/dashboard/kpi-primary";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatBRL,
  formatDataBR,
  formatDocumento,
} from "@/lib/format";
import type {
  CessaoResumo,
  FluxoMensal,
  InadimplenciaItem,
  AgingBucket,
  DSO,
  ComparativoMes,
} from "@/types/database";

export const metadata = {
  title: "Visão geral — Painel MNZ",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [cessoesRes, fluxoRes, inadRes, agingRes, dsoRes, compRes] =
    await Promise.all([
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
      supabase.from("v_aging_buckets").select("*").returns<AgingBucket[]>(),
      supabase.from("v_dso").select("*").maybeSingle<DSO>(),
      supabase
        .from("v_comparativo_mes")
        .select("*")
        .maybeSingle<ComparativoMes>(),
    ]);

  if (cessoesRes.error) {
    return <SchemaPendente erro={cessoesRes.error.message} />;
  }

  const cessoes = cessoesRes.data ?? [];
  const fluxo = fluxoRes.data ?? [];
  const inadimplentes = inadRes.data ?? [];
  const aging = agingRes.data ?? [];
  const dso = dsoRes.data;
  const comparativo = compRes.data;

  const variacao =
    comparativo && comparativo.mes_anterior > 0
      ? ((comparativo.mes_atual - comparativo.mes_anterior) /
          comparativo.mes_anterior) *
        100
      : null;

  const totais = cessoes.reduce(
    (acc, c) => {
      acc.total += Number(c.valor_total);
      acc.pago += Number(c.valor_pago);
      acc.saldo += Number(c.saldo_devedor);
      if (c.primeira_parcela_atrasada) acc.cessoesEmAtraso += 1;
      return acc;
    },
    { total: 0, pago: 0, saldo: 0, cessoesEmAtraso: 0 },
  );

  const valorAtrasado = inadimplentes.reduce(
    (sum, i) => sum + Number(i.valor),
    0,
  );

  // Pizza por status (top 6 cessões por valor)
  const topCessoes = [...cessoes]
    .sort((a, b) => Number(b.valor_total) - Number(a.valor_total))
    .slice(0, 6)
    .map((c) => ({
      name: `${c.numero_contrato} — ${truncate(c.cliente_nome, 18)}`,
      value: Number(c.valor_total),
    }));

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
          Visão geral
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Recebíveis em andamento
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Painel financeiro consolidado de todas as cessões de crédito.
        </p>
      </header>

      {/* KPI primário + secundários */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Primário destacado — ocupa 2 colunas no desktop */}
        <div className="lg:col-span-2">
          <KpiPrimary
            label="Saldo a receber"
            value={totais.saldo}
            variacao={variacao}
            sub={`${cessoes.length} cessão${cessoes.length === 1 ? "" : "ões"} ativa${cessoes.length === 1 ? "" : "s"} · ${formatBRL(totais.total)} volume total`}
            icon={<IconMoney />}
          />
        </div>
        <KpiAnimado
          label="Recebido"
          value={totais.pago}
          accent="success"
        />
        <KpiAnimado
          label="Em atraso"
          value={valorAtrasado}
          accent={valorAtrasado > 0 ? "danger" : "muted"}
          sub={`${inadimplentes.length} parcela${inadimplentes.length === 1 ? "" : "s"}`}
        />
      </section>

      {/* KPIs linha 2: DSO + comparativo */}
      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi
          label="DSO (prazo médio)"
          value={
            dso && dso.parcelas_consideradas > 0
              ? `${dso.dso_dias} ${dso.dso_dias === 1 ? "dia" : "dias"}`
              : "—"
          }
          sub={
            dso && dso.parcelas_consideradas > 0
              ? `Média dos últimos 180 dias · ${dso.parcelas_consideradas} pagamentos`
              : "Sem dados suficientes"
          }
          accent={
            dso && dso.dso_dias > 15
              ? "warning"
              : dso && dso.dso_dias > 0
                ? "success"
                : "muted"
          }
        />
        <Kpi
          label="Recebido este mês"
          value={comparativo ? formatBRL(comparativo.mes_atual) : "—"}
          sub={
            comparativo
              ? `Mês anterior: ${formatBRL(comparativo.mes_anterior)}`
              : undefined
          }
          accent="success"
        />
        <Kpi
          label="Variação MoM"
          value={
            variacao === null
              ? "—"
              : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}%`
          }
          sub={
            variacao === null
              ? "Precisa do mês anterior"
              : variacao >= 0
                ? "Crescimento vs mês anterior"
                : "Queda vs mês anterior"
          }
          accent={
            variacao === null
              ? "muted"
              : variacao >= 0
                ? "success"
                : "danger"
          }
        />
      </section>

      {/* Aging + gráficos */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FluxoMensalChart data={fluxo} />
        </div>
        <AgingBuckets data={aging} />
      </section>

      {/* Pizza cessões */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CessoesPizzaChart
          titulo="Maiores cessões"
          subtitulo="Top 6 por volume"
          data={topCessoes}
        />
      </section>

      {/* Inadimplência destaque */}
      {inadimplentes.length > 0 && (
        <section className="mt-8 rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-6">
          <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--danger)]">
                Atenção: parcelas em atraso
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {inadimplentes.length} parcela
                {inadimplentes.length === 1 ? "" : "s"} pendente
                {inadimplentes.length === 1 ? "" : "s"} de cobrança
              </h2>
            </div>
            <Link
              href="/dashboard/pagamentos?filtro=atrasados"
              className="text-xs text-[var(--gold)] hover:underline"
            >
              Ver todos →
            </Link>
          </header>

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
            <table className="w-full text-sm">
              <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contrato</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Dias atraso
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {inadimplentes.slice(0, 5).map((i) => (
                  <tr
                    key={i.pagamento_id}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{i.cliente_nome}</div>
                      <div className="font-mono text-xs text-[var(--muted)]">
                        {formatDocumento(i.cliente_documento)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {i.numero_contrato}
                    </td>
                    <td className="px-4 py-3">
                      {formatDataBR(i.data_vencimento)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--danger)]">
                      {formatBRL(i.valor)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="danger">{i.dias_atraso} d</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/cessoes/${i.cessao_id}`}
                        className="text-xs text-[var(--gold)] hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
                {inadimplentes.length > 5 && (
                  <tr className="border-t border-[var(--border)]">
                    <td
                      colSpan={6}
                      className="px-4 py-3 text-center text-xs text-[var(--muted)]"
                    >
                      + {inadimplentes.length - 5} parcela
                      {inadimplentes.length - 5 === 1 ? "" : "s"} adicional
                      {inadimplentes.length - 5 === 1 ? "" : "is"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lista de cessões com pizza individual */}
      <section className="mt-10">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Cessões cadastradas ({cessoes.length})
          </h2>
          <Link
            href="/dashboard/cessoes"
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Gerenciar →
          </Link>
        </header>

        {cessoes.length === 0 ? (
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
                {cessoes.map((c) => (
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

function Kpi({
  label,
  value,
  sub,
  accent = "muted",
}: {
  label: string;
  value: string;
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
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs text-[var(--muted)]/70">{sub}</p>
      )}
    </div>
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

function IconMoney() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h5a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h5" />
    </svg>
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
    return <Badge variant="danger">Em atraso</Badge>;
  }
  const map: Record<CessaoResumo["status"], React.ReactNode> = {
    ativa: <Badge variant="gold">Ativa</Badge>,
    quitada: <Badge variant="success">Quitada</Badge>,
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
