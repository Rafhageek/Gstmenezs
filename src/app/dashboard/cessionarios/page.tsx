import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { SortableHeader } from "@/components/ui/sortable-header";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { Pagination } from "@/components/ui/pagination";
import { formatBRL, formatDataBR, formatDocumento, formatTelefone, digits } from "@/lib/format";
import type { Cessionario } from "@/types/database";

export const metadata = {
  title: "Cessionários — Painel MNZ",
};

const PAGE_SIZE = 20;
const COLUNAS_ORDENAVEIS = [
  "nome",
  "documento",
  "data_contrato",
  "valor_cessao",
  "percentual",
  "created_at",
] as const;

interface SearchParams {
  q?: string;
  de?: string;
  ate?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

export default async function CessionariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sort = COLUNAS_ORDENAVEIS.includes(
    sp.sort as (typeof COLUNAS_ORDENAVEIS)[number],
  )
    ? (sp.sort as string)
    : "nome";
  const ascending = (sp.dir ?? "asc") !== "desc";
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let query = supabase
    .from("cessionarios")
    .select("*", { count: "exact" })
    .order(sort, { ascending, nullsFirst: false });

  if (sp.q) {
    const onlyDigits = digits(sp.q);
    if (onlyDigits.length >= 3) {
      query = query.or(
        `nome.ilike.%${sp.q}%,documento.ilike.%${onlyDigits}%`,
      );
    } else {
      query = query.ilike("nome", `%${sp.q}%`);
    }
  }

  // Filtro por data_contrato (desde / até)
  if (sp.de) {
    query = query.gte("data_contrato", sp.de);
  }
  if (sp.ate) {
    query = query.lte("data_contrato", sp.ate);
  }

  // Filtro por status ativo/inativo
  if (sp.status === "ativo") query = query.eq("ativo", true);
  if (sp.status === "inativo") query = query.eq("ativo", false);

  const { data, count, error } = await query
    .range(offset, offset + PAGE_SIZE - 1)
    .returns<Cessionario[]>();

  if (error) {
    return (
      <div>
        <PageHeader titulo="Cessionários" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const cessionarios = data ?? [];
  const total = count ?? 0;

  const baseQuery = new URLSearchParams();
  if (sp.q) baseQuery.set("q", sp.q);
  if (sp.de) baseQuery.set("de", sp.de);
  if (sp.ate) baseQuery.set("ate", sp.ate);
  if (sp.status) baseQuery.set("status", sp.status);
  if (sp.sort) baseQuery.set("sort", sp.sort);
  if (sp.dir) baseQuery.set("dir", sp.dir);

  return (
    <div>
      <PageHeader
        titulo="Cessionários"
        descricao="Recebedores das cessões de crédito."
        acao={{
          label: "+ Novo cessionário",
          href: "/dashboard/cessionarios/novo",
        }}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput placeholder="Buscar por nome ou CPF/CNPJ..." />
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter labelDe="Contrato de" labelAte="até" />
          <StatusTabs current={sp.status} baseParams={baseQuery.toString()} />
        </div>
      </div>

      <DataTable
        headers={[
          "Nº",
          <SortableHeader key="nome" label="Nome" column="nome" />,
          <SortableHeader key="doc" label="CPF/CNPJ" column="documento" />,
          <SortableHeader
            key="dc"
            label="Data contrato"
            column="data_contrato"
          />,
          <SortableHeader
            key="vc"
            label="Valor cessão"
            column="valor_cessao"
          />,
          <SortableHeader
            key="pc"
            label="% Cedida"
            column="percentual"
          />,
          "Status",
          "",
        ]}
        rows={cessionarios.map((c, idx) => [
          <span
            key="num"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 font-mono text-xs font-semibold text-[var(--gold)]"
          >
            {String(offset + idx + 1).padStart(2, "0")}
          </span>,
          <div key="n">
            <div className="font-medium">{c.nome}</div>
            <div className="text-[11px] text-[var(--muted)]">
              {formatTelefone(c.telefone) || "sem telefone"}
            </div>
          </div>,
          <span key="d" className="font-mono text-xs">
            {formatDocumento(c.documento)}
          </span>,
          <span key="dc" className="text-xs text-[var(--muted)]">
            {c.data_contrato ? formatDataBR(c.data_contrato) : "—"}
          </span>,
          <span key="vce" className="font-mono text-xs text-[var(--gold)]">
            {c.valor_cessao != null ? formatBRL(c.valor_cessao) : "—"}
          </span>,
          <span key="pc" className="font-mono text-xs">
            {c.percentual != null
              ? `${Number(c.percentual).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`
              : "—"}
          </span>,
          c.ativo ? (
            <Badge key="s" variant="success">
              Ativo
            </Badge>
          ) : (
            <Badge key="s" variant="neutral">
              Inativo
            </Badge>
          ),
          <div key="a" className="flex gap-3 text-xs">
            <Link
              href={`/dashboard/cessionarios/${c.id}`}
              className="text-[var(--gold)] hover:underline"
            >
              Detalhes
            </Link>
            <Link
              href={`/dashboard/cessionarios/${c.id}/editar`}
              className="text-[var(--muted)] hover:text-foreground hover:underline"
            >
              Editar
            </Link>
          </div>,
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

function StatusTabs({
  current,
  baseParams,
}: {
  current?: string;
  baseParams: string;
}) {
  const opcoes = [
    { value: undefined, label: "Todos" },
    { value: "ativo", label: "Ativos" },
    { value: "inativo", label: "Inativos" },
  ];

  function hrefFor(valor?: string) {
    const params = new URLSearchParams(baseParams);
    if (valor) params.set("status", valor);
    else params.delete("status");
    params.delete("page");
    const qs = params.toString();
    return qs ? `?${qs}` : "/dashboard/cessionarios";
  }

  return (
    <nav className="flex gap-1 rounded-full border border-[var(--border)] bg-black/20 p-1">
      {opcoes.map((o) => {
        const active = (current ?? "") === (o.value ?? "");
        return (
          <Link
            key={o.label}
            href={hrefFor(o.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-[var(--gold)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-foreground"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
