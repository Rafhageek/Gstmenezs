import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/feedback";
import { formatBRL, formatDataBR, formatDocumento } from "@/lib/format";
import { PagarParcelaButton, EstornarButton } from "./parcela-actions";
import type {
  CessaoCredito,
  ClientePrincipal,
  Cessionario,
  Pagamento,
} from "@/types/database";

export const metadata = {
  title: "Detalhes da cessão — Painel MNZ",
};

interface Props {
  params: Promise<{ id: string }>;
}

interface CessaoFull extends CessaoCredito {
  cliente_principal: Pick<ClientePrincipal, "id" | "nome" | "documento">;
  cessionario: Pick<Cessionario, "id" | "nome" | "documento">;
}

export default async function CessaoDetalhesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cessao }, { data: pagamentos }] = await Promise.all([
    supabase
      .from("cessoes_credito")
      .select(
        `*, cliente_principal:clientes_principais(id,nome,documento), cessionario:cessionarios(id,nome,documento)`,
      )
      .eq("id", id)
      .single<CessaoFull>(),
    supabase
      .from("pagamentos")
      .select("*")
      .eq("cessao_id", id)
      .order("numero_parcela", { ascending: true })
      .returns<Pagamento[]>(),
  ]);

  if (!cessao) notFound();

  const parcelas = pagamentos ?? [];
  const saldo = Number(cessao.valor_total) - Number(cessao.valor_pago);
  const pct =
    cessao.valor_total > 0
      ? (Number(cessao.valor_pago) / Number(cessao.valor_total)) * 100
      : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Cessão de crédito"
        titulo={`Contrato ${cessao.numero_contrato}`}
        descricao={`${cessao.cliente_principal.nome} → ${cessao.cessionario.nome}`}
      />

      <div className="-mt-6 mb-8 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/cessoes/${cessao.id}/editar`}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[var(--gold)]"
        >
          Editar
        </Link>
        <a
          href={`/api/relatorios/cessao/${cessao.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)]"
        >
          ⬇ Imprimir PDF
        </a>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi label="Valor total" value={formatBRL(cessao.valor_total)} />
        <Kpi label="Pago" value={formatBRL(cessao.valor_pago)} accent="success" />
        <Kpi label="Saldo devedor" value={formatBRL(saldo)} accent="gold" />
        <Kpi label="% Pago" value={`${pct.toFixed(1)}%`} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <PartesCard
          titulo="Cliente principal (cedente)"
          nome={cessao.cliente_principal.nome}
          documento={cessao.cliente_principal.documento}
          link={`/dashboard/clientes/${cessao.cliente_principal.id}/editar`}
        />
        <PartesCard
          titulo="Cessionário (recebedor)"
          nome={cessao.cessionario.nome}
          documento={cessao.cessionario.documento}
          link={`/dashboard/cessionarios/${cessao.cessionario.id}/editar`}
        />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Cronograma de parcelas ({parcelas.length})
          </h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Pago em</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[var(--border)] align-top"
                >
                  <td className="px-4 py-3 font-mono">
                    {p.numero_parcela}
                    {p.is_reversal && (
                      <Badge variant="danger">estorno</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDataBR(p.data_vencimento)}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      p.is_reversal ? "text-[var(--danger)]" : ""
                    }`}
                  >
                    {p.is_reversal ? "−" : ""}
                    {formatBRL(p.valor)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {formatDataBR(p.data_pagamento)}
                  </td>
                  <td className="px-4 py-3">
                    <ParcelaStatus parcela={p} />
                  </td>
                  <td className="px-4 py-3">
                    <ParcelaAcao parcela={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function PartesCard({
  titulo,
  nome,
  documento,
  link,
}: {
  titulo: string;
  nome: string;
  documento: string;
  link: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {titulo}
      </p>
      <p className="mt-2 text-lg font-semibold">{nome}</p>
      <p className="mt-1 font-mono text-xs text-[var(--muted)]">
        {formatDocumento(documento)}
      </p>
      <Link
        href={link}
        className="mt-3 inline-block text-xs text-[var(--gold)] hover:underline"
      >
        Ver cadastro →
      </Link>
    </div>
  );
}

function ParcelaStatus({ parcela }: { parcela: Pagamento }) {
  if (parcela.is_reversal) return <Badge variant="danger">Estorno</Badge>;
  if (parcela.data_pagamento) return <Badge variant="success">Pago</Badge>;
  const venc = new Date(parcela.data_vencimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (venc < hoje) return <Badge variant="danger">Atrasado</Badge>;
  return <Badge variant="gold">Aberto</Badge>;
}

function ParcelaAcao({ parcela }: { parcela: Pagamento }) {
  if (parcela.is_reversal) {
    return <span className="text-xs text-[var(--muted)]">—</span>;
  }
  if (!parcela.data_pagamento) {
    return (
      <PagarParcelaButton
        pagamentoId={parcela.id}
        valorSugerido={Number(parcela.valor)}
      />
    );
  }
  return <EstornarButton pagamentoId={parcela.id} />;
}
