import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Pagination } from "@/components/ui/pagination";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { CessaoResumo } from "@/types/database";

export const metadata = {
  title: "Cessões — Painel Financeiro",
};

const PAGE_SIZE = 20;
const COLUNAS_ORDENAVEIS = [
  "numero_contrato",
  "cliente_nome",
  "valor_total",
  "valor_pago",
  "data_vencimento_inicial",
  "status",
] as const;

interface SearchParams {
  q?: string;
  status?: string;
  filtro?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

export default async function CessoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sort = COLUNAS_ORDENAVEIS.includes(
    sp.sort as (typeof COLUNAS_ORDENAVEIS)[number],
  )
    ? (sp.sort as string)
    : "data_vencimento_inicial";
  const ascending = (sp.dir ?? "asc") !== "desc";
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("v_cessoes_resumo")
    .select("*", { count: "exact" })
    .order(sort, { ascending });

  if (sp.q) {
    query = query.or(
      `numero_contrato.ilike.%${sp.q}%,cliente_nome.ilike.%${sp.q}%,cessionario_nome.ilike.%${sp.q}%`,
    );
  }
  // atalho ?filtro=liquidadas vira status=quitada
  const statusEfetivo =
    sp.filtro === "liquidadas" ? "quitada" : sp.status;

  if (statusEfetivo && statusEfetivo !== "todos") {
    query = query.eq("status", statusEfetivo);
  }

  const { data, count, error } = await query
    .range(offset, offset + PAGE_SIZE - 1)
    .returns<CessaoResumo[]>();

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Operação" titulo="Cessões de Crédito" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const cessoes = data ?? [];
  const total = count ?? 0;

  const baseQuery = new URLSearchParams();
  if (sp.q) baseQuery.set("q", sp.q);
  if (sp.status) baseQuery.set("status", sp.status);
  if (sp.sort) baseQuery.set("sort", sp.sort);
  if (sp.dir) baseQuery.set("dir", sp.dir);

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
          href={`/api/exportar/cessoes${sp.q ? `?q=${encodeURIComponent(sp.q)}` : ""}`}
          className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[var(--gold)]"
          download
        >
          ⬇ Exportar CSV
        </a>
      </div>

      <nav className="mb-4 flex flex-wrap gap-2">
        <FilterTab
          label="Todas"
          value="todos"
          current={statusEfetivo ?? "todos"}
          q={sp.q}
        />
        <FilterTab
          label="A receber"
          value="ativa"
          current={statusEfetivo ?? "todos"}
          q={sp.q}
        />
        <FilterTab
          label="Liquidadas"
          value="quitada"
          current={statusEfetivo ?? "todos"}
          q={sp.q}
        />
        <FilterTab
          label="Inadimplentes"
          value="inadimplente"
          current={statusEfetivo ?? "todos"}
          q={sp.q}
        />
        <FilterTab
          label="Canceladas"
          value="cancelada"
          current={statusEfetivo ?? "todos"}
          q={sp.q}
        />
      </nav>

      <DataTable
        headers={[
          <SortableHeader
            key="c"
            label="Contrato"
            column="numero_contrato"
          />,
          <SortableHeader
            key="cl"
            label="Cliente / Cessionário"
            column="cliente_nome"
          />,
          <SortableHeader
            key="v"
            label="Valor total"
            column="valor_total"
          />,
          <SortableHeader key="p" label="Pago" column="valor_pago" />,
          "% Pago",
          <SortableHeader
            key="d"
            label="1º vencimento"
            column="data_vencimento_inicial"
          />,
          <SortableHeader key="s" label="Status" column="status" />,
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

      <Pagination
        total={total}
        pageSize={PAGE_SIZE}
        currentPage={page}
        baseQuery={baseQuery.toString()}
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
