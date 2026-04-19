import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { CessaoResumo } from "@/types/database";

export const metadata = {
  title: "Cessões — Painel MNZ",
};

interface SearchParams {
  q?: string;
  status?: string;
}

export default async function CessoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("v_cessoes_resumo")
    .select("*")
    .order("data_vencimento_inicial", { ascending: true });

  if (q) {
    query = query.or(
      `numero_contrato.ilike.%${q}%,cliente_nome.ilike.%${q}%,cessionario_nome.ilike.%${q}%`,
    );
  }
  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<CessaoResumo[]>();

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Operação" titulo="Cessões de Crédito" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const cessoes = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        titulo="Cessões de Crédito"
        descricao="Contratos entre clientes principais e cessionários."
        acao={{ label: "+ Nova cessão", href: "/dashboard/cessoes/nova" }}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput placeholder="Buscar por contrato, cliente ou cessionário..." />
        <a
          href={`/api/exportar/cessoes${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[var(--gold)]"
          download
        >
          ⬇ Exportar CSV
        </a>
      </div>

      <nav className="mb-4 flex flex-wrap gap-2">
        <FilterTab label="Todas" value="todos" current={status ?? "todos"} q={q} />
        <FilterTab label="Ativas" value="ativa" current={status ?? "todos"} q={q} />
        <FilterTab label="Quitadas" value="quitada" current={status ?? "todos"} q={q} />
        <FilterTab label="Inadimplentes" value="inadimplente" current={status ?? "todos"} q={q} />
        <FilterTab label="Canceladas" value="cancelada" current={status ?? "todos"} q={q} />
      </nav>

      <DataTable
        headers={[
          "Contrato",
          "Cliente / Cessionário",
          "Valor total",
          "Pago",
          "% Pago",
          "1º vencimento",
          "Status",
          "",
        ]}
        rows={cessoes.map((c) => [
          <span key="n" className="font-mono text-xs">
            {c.numero_contrato}
          </span>,
          <div key="p" className="leading-tight">
            <div className="font-medium">{c.cliente_nome}</div>
            <div className="text-xs text-[var(--muted)]">
              → {c.cessionario_nome}
            </div>
          </div>,
          <span key="v" className="font-mono">
            {formatBRL(c.valor_total)}
          </span>,
          <span key="pg" className="font-mono text-[var(--success)]">
            {formatBRL(c.valor_pago)}
          </span>,
          <span key="pct" className="font-mono">
            {c.percentual_pago.toFixed(1)}%
          </span>,
          <span key="d" className="text-[var(--muted)]">
            {formatDataBR(c.data_vencimento_inicial)}
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
            Detalhes
          </Link>,
        ])}
      />
    </div>
  );
}

function FilterTab({
  label,
  value,
  current,
  q,
}: {
  label: string;
  value: string;
  current: string;
  q?: string;
}) {
  const active = value === current;
  const params = new URLSearchParams();
  if (value !== "todos") params.set("status", value);
  if (q) params.set("q", q);
  const qs = params.toString();
  return (
    <Link
      href={qs ? `/dashboard/cessoes?${qs}` : "/dashboard/cessoes"}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)]/40 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
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
