import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { CessoesPizzaChart } from "@/components/charts/cessoes-pizza-chart";
import { formatBRL, formatDataBR, formatDocumento } from "@/lib/format";
import type { Cessionario, CessaoResumo } from "@/types/database";

export const metadata = {
  title: "Detalhes do cessionário — Painel Financeiro",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CessionarioDetalhesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cessionario }, { data: cessoes }] = await Promise.all([
    supabase
      .from("cessionarios")
      .select("*")
      .eq("id", id)
      .single<Cessionario>(),
    supabase
      .from("v_cessoes_resumo")
      .select("*")
      .eq("cessionario_id", id)
      .order("data_cessao", { ascending: false })
      .returns<CessaoResumo[]>(),
  ]);

  if (!cessionario) notFound();

  const lista = cessoes ?? [];
  const totais = lista.reduce(
    (acc, c) => {
      acc.total += Number(c.valor_total);
      acc.recebido += Number(c.valor_pago);
      acc.saldo += Number(c.saldo_devedor);
      return acc;
    },
    { total: 0, recebido: 0, saldo: 0 },
  );

  // Busca TODOS os pagamentos efetivados das cessoes desse cessionario
  type Pago = {
    cessao_id: string;
    data_pagamento: string;
    valor: number;
    is_reversal: boolean;
  };

  let pagamentosPagos: Pago[] = [];
  if (lista.length > 0) {
    const { data: pagsRaw } = await supabase
      .from("pagamentos")
      .select("cessao_id, data_pagamento, valor, is_reversal")
      .in(
        "cessao_id",
        lista.map((c) => c.id),
      )
      .not("data_pagamento", "is", null)
      .order("data_pagamento", { ascending: true });

    pagamentosPagos = (pagsRaw ?? []) as Pago[];
  }

  // Ultima data por cessao (mantido pra tabela "Cessoes recebidas")
  const ultimaDataPorCessao = new Map<string, string>();
  for (const p of [...pagamentosPagos].reverse()) {
    if (!ultimaDataPorCessao.has(p.cessao_id)) {
      ultimaDataPorCessao.set(p.cessao_id, p.data_pagamento);
    }
  }

  // Extrato de recebimentos com saldo running (total das cessoes - acumulado)
  type Recebimento = {
    data: string;
    valor: number;
    saldo: number;
  };
  const extrato: Recebimento[] = [];
  let acumulado = 0;
  for (const p of pagamentosPagos) {
    const val = p.is_reversal ? -Number(p.valor) : Number(p.valor);
    acumulado += val;
    extrato.push({
      data: p.data_pagamento,
      valor: val,
      saldo: totais.total - acumulado,
    });
  }

  const pizzaData = [
    { name: "Total recebido", value: totais.recebido },
    { name: "Total a receber", value: totais.saldo },
  ].filter((d) => d.value > 0);

  const pctRecebido =
    totais.total > 0 ? (totais.recebido / totais.total) * 100 : 0;
  const pctAReceber = 100 - pctRecebido;

  return (
    <div>
      <PageHeader
        eyebrow="Cessionário"
        titulo={cessionario.nome}
        descricao={formatDocumento(cessionario.documento)}
      />

      <div className="-mt-6 mb-8 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/cessionarios/${cessionario.id}/editar`}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-2 text-xs font-semibold hover:border-[var(--gold)]"
        >
          Editar cadastro
        </Link>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Valor da cessão" value={formatBRL(totais.total)} />
        <Kpi
          label="Total recebido"
          value={formatBRL(totais.recebido)}
          accent="success"
        />
        <Kpi
          label="Total a receber"
          value={formatBRL(totais.saldo)}
          accent="gold"
        />
        <Kpi label="Cessões" value={String(lista.length)} />
      </section>

      {/* Pizza (Total recebido vs a receber) + Extrato de recebimentos */}
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {pizzaData.length > 0 ? (
            <CessoesPizzaChart
              subtitulo={`${pctRecebido.toFixed(1)}% recebido · ${pctAReceber.toFixed(1)}% a receber`}
              data={pizzaData}
              colors={["#10b981", "#c9a961"]}
              centerLabel={`${pctRecebido.toFixed(1)}%`}
              centerSub="recebido"
            />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-5 text-center text-sm text-[var(--muted)]">
              Sem dados suficientes para o gráfico.
            </div>
          )}

          {/* Card % Cedida — fatia do credito total do cedente */}
          {cessionario.percentual != null && (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5">
              <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
                % Cedida a este cessionário
              </p>
              <p className="mt-2 text-3xl font-semibold font-mono text-[var(--gold)]">
                {Number(cessionario.percentual).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
                %
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Fatia do crédito total do cliente cedente — é uma proporção,
                não a % paga vs a receber.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
          <header className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Extrato de recebimentos
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]/70">
                {extrato.length} lançamento{extrato.length === 1 ? "" : "s"} efetivado{extrato.length === 1 ? "" : "s"}
              </p>
            </div>
          </header>

          {extrato.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--muted)]">
              Nenhum pagamento registrado ainda.
            </p>
          ) : (
            <div className="max-h-[280px] overflow-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-black/40 text-left uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Recebimento
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {extrato.map((r, i) => (
                    <tr key={i} className="border-t border-[var(--border)]/60">
                      <td className="px-3 py-2">{formatDataBR(r.data)}</td>
                      <td
                        className={`px-3 py-2 text-right ${
                          r.valor >= 0
                            ? "text-[var(--success)]"
                            : "text-[var(--danger)]"
                        }`}
                      >
                        {formatBRL(r.valor)}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--muted)]">
                        {formatBRL(r.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {cessionario.observacoes && (
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Observações
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {cessionario.observacoes}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Cessões recebidas ({lista.length})
        </h2>
        <DataTable
          headers={["Data", "Valor pago", "Status", ""]}
          rows={lista.map((c) => {
            const ultimaData = ultimaDataPorCessao.get(c.id);
            return [
              <span key="d" className="text-sm text-[var(--muted)]">
                {ultimaData ? formatDataBR(ultimaData) : "—"}
              </span>,
              <span key="vp" className="font-mono text-[var(--success)]">
                {formatBRL(c.valor_pago)}
              </span>,
              <StatusBadgeView
                key="s"
                status={c.status}
                atrasado={!!c.primeira_parcela_atrasada}
              />,
              <Link
                key="a"
                href={`/dashboard/cessoes/${c.id}`}
                className="text-xs text-[var(--gold)] hover:underline"
              >
                Abrir
              </Link>,
            ];
          })}
          empty={
            <p className="text-sm text-[var(--muted)]">
              Nenhuma cessão associada a este cessionário.
            </p>
          }
        />
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = "muted",
}: {
  label: string;
  value: string;
  accent?: "muted" | "gold" | "success" | "danger";
}) {
  const colorMap = {
    muted: "text-foreground",
    gold: "text-[var(--gold)]",
    success: "text-[var(--success)]",
    danger: "text-[var(--danger)]",
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${colorMap[accent]}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadgeView({
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
