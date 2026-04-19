import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { formatDocumento, formatTelefone, digits } from "@/lib/format";
import type { ClientePrincipal } from "@/types/database";

export const metadata = {
  title: "Clientes Principais — Painel MNZ",
};

interface SearchParams {
  q?: string;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clientes_principais")
    .select("*")
    .order("nome", { ascending: true });

  if (q) {
    const onlyDigits = digits(q);
    if (onlyDigits.length >= 3) {
      query = query.or(`nome.ilike.%${q}%,documento.ilike.%${onlyDigits}%`);
    } else {
      query = query.ilike("nome", `%${q}%`);
    }
  }

  const { data, error } = await query.returns<ClientePrincipal[]>();

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Cadastros" titulo="Clientes Principais" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const clientes = data ?? [];

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
        headers={["Nome", "CPF/CNPJ", "Telefone", "E-mail", "Status", ""]}
        rows={clientes.map((c) => [
          <span key="n" className="font-medium">{c.nome}</span>,
          <span key="d" className="font-mono text-xs">{formatDocumento(c.documento)}</span>,
          <span key="t" className="text-[var(--muted)]">{formatTelefone(c.telefone) || "—"}</span>,
          <span key="e" className="text-[var(--muted)]">{c.email || "—"}</span>,
          c.ativo ? (
            <Badge key="s" variant="success">Ativo</Badge>
          ) : (
            <Badge key="s" variant="neutral">Inativo</Badge>
          ),
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
    </div>
  );
}
