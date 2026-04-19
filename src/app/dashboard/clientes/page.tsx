import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Pagination } from "@/components/ui/pagination";
import { formatDocumento, formatTelefone, digits } from "@/lib/format";
import type { ClientePrincipal } from "@/types/database";

export const metadata = {
  title: "Clientes Principais — Painel MNZ",
};

const PAGE_SIZE = 20;
const COLUNAS_ORDENAVEIS = ["nome", "documento", "created_at"] as const;

interface SearchParams {
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

export default async function ClientesPage({
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
    .from("clientes_principais")
    .select("*", { count: "exact" })
    .order(sort, { ascending });

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

  const { data, count, error } = await query
    .range(offset, offset + PAGE_SIZE - 1)
    .returns<ClientePrincipal[]>();

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Cadastros" titulo="Clientes Principais" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const clientes = data ?? [];
  const total = count ?? 0;

  const baseQuery = new URLSearchParams();
  if (sp.q) baseQuery.set("q", sp.q);
  if (sp.sort) baseQuery.set("sort", sp.sort);
  if (sp.dir) baseQuery.set("dir", sp.dir);

  return (
    <div>
      <PageHeader
        eyebrow="Cadastros"
        titulo="Clientes Principais"
        descricao="Cedentes do crédito (titulares dos recebíveis)."
        acao={{ label: "+ Novo cliente", href: "/dashboard/clientes/novo" }}
      />

      <div className="mb-4">
        <SearchInput placeholder="Buscar por nome ou CPF/CNPJ..." />
      </div>

      <DataTable
        headers={[
          <SortableHeader key="nome" label="Nome" column="nome" />,
          <SortableHeader
            key="doc"
            label="CPF/CNPJ"
            column="documento"
          />,
          "Telefone",
          "E-mail",
          "Status",
          <SortableHeader
            key="created"
            label="Cadastrado"
            column="created_at"
          />,
          "",
        ]}
        rows={clientes.map((c) => [
          <span key="n" className="font-medium">
            {c.nome}
          </span>,
          <span key="d" className="font-mono text-xs">
            {formatDocumento(c.documento)}
          </span>,
          <span key="t" className="text-[var(--muted)]">
            {formatTelefone(c.telefone) || "—"}
          </span>,
          <span key="e" className="text-[var(--muted)]">
            {c.email || "—"}
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
          <span key="cr" className="text-xs text-[var(--muted)]">
            {c.created_at.slice(0, 10).split("-").reverse().join("/")}
          </span>,
          <div key="a" className="flex gap-3 text-xs">
            <Link
              href={`/dashboard/clientes/${c.id}`}
              className="text-[var(--gold)] hover:underline"
            >
              Detalhes
            </Link>
            <a
              href={`/api/relatorios/extrato-cliente/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted)] hover:text-[var(--gold)] hover:underline"
              title="Imprimir extrato em PDF"
            >
              PDF
            </a>
            <Link
              href={`/dashboard/clientes/${c.id}/editar`}
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
