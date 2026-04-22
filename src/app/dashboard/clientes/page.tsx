import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Pagination } from "@/components/ui/pagination";
import { DeleteClienteButton } from "./delete-cliente-button";
import { formatDocumento, formatTelefone, digits } from "@/lib/format";
import type { ClientePrincipal, InadimplenciaItem } from "@/types/database";

export const metadata = {
  title: "Clientes Principais — Painel Financeiro",
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

  const [{ data, count, error }, inadRes] = await Promise.all([
    query
      .range(offset, offset + PAGE_SIZE - 1)
      .returns<ClientePrincipal[]>(),
    supabase
      .from("v_inadimplencia")
      .select("cliente_id, valor, dias_atraso")
      .returns<Pick<InadimplenciaItem, "cliente_id" | "valor" | "dias_atraso">[]>(),
  ]);

  if (error) {
    return (
      <div>
        <PageHeader titulo="Clientes Principais" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const clientes = data ?? [];
  const total = count ?? 0;

  // Agrupa inadimplencias por cliente
  const inadimplenciaPorCliente = new Map<string, { qtd: number; valor: number }>();
  for (const i of inadRes.data ?? []) {
    const atual = inadimplenciaPorCliente.get(i.cliente_id) ?? { qtd: 0, valor: 0 };
    atual.qtd += 1;
    atual.valor += Number(i.valor);
    inadimplenciaPorCliente.set(i.cliente_id, atual);
  }

  const baseQuery = new URLSearchParams();
  if (sp.q) baseQuery.set("q", sp.q);
  if (sp.sort) baseQuery.set("sort", sp.sort);
  if (sp.dir) baseQuery.set("dir", sp.dir);

  return (
    <div>
      <PageHeader
        titulo="Clientes Principais"
        descricao="Cedentes do crédito (titulares dos recebíveis)."
        acaoSecundaria={{
          label: "Cessionários",
          href: "/dashboard/cessionarios",
        }}
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
        rows={clientes.map((c) => {
          const inad = inadimplenciaPorCliente.get(c.id);
          return [
          <div key="n" className="flex items-center gap-2">
            {inad && (
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--danger)]"
                title={`${inad.qtd} parcela(s) em atraso`}
                aria-label="Cliente com cessão inadimplente"
              />
            )}
            <div>
              <div className="font-medium">{c.nome}</div>
              {inad && (
                <div className="text-[10px] text-[var(--danger)]">
                  ⚠ {inad.qtd} parcela{inad.qtd === 1 ? "" : "s"} em atraso
                </div>
              )}
            </div>
          </div>,
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
            <DeleteClienteButton id={c.id} nome={c.nome} />
          </div>,
        ];
        })}
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
