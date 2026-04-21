import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
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

  // Busca a ultima data de pagamento de cada cessao desta lista
  const ultimaDataPorCessao = new Map<string, string>();
  if (lista.length > 0) {
    const { data: pagsRaw } = await supabase
      .from("pagamentos")
      .select("cessao_id, data_pagamento")
      .in(
        "cessao_id",
        lista.map((c) => c.id),
      )
      .not("data_pagamento", "is", null)
      .order("data_pagamento", { ascending: false });

    for (const p of (pagsRaw ?? []) as {
      cessao_id: string;
      data_pagamento: string;
    }[]) {
      if (!ultimaDataPorCessao.has(p.cessao_id)) {
        ultimaDataPorCessao.set(p.cessao_id, p.data_pagamento);
      }
    }
  }

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
