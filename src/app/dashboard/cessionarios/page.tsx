import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { formatDocumento, formatTelefone, digits } from "@/lib/format";
import type { Cessionario } from "@/types/database";

export const metadata = {
  title: "Cessionários — Painel MNZ",
};

interface SearchParams {
  q?: string;
}

export default async function CessionariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("cessionarios")
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

  const { data, error } = await query.returns<Cessionario[]>();

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Cadastros" titulo="Cessionários" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const cessionarios = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Cadastros"
        titulo="Cessionários"
        descricao="Recebedores das cessões de crédito."
        acao={{
          label: "+ Novo cessionário",
          href: "/dashboard/cessionarios/novo",
        }}
      />

      <div className="mb-4">
        <SearchInput placeholder="Buscar por nome ou CPF/CNPJ..." />
      </div>

      <DataTable
        headers={["Nome", "CPF/CNPJ", "Telefone", "Banco", "Status", ""]}
        rows={cessionarios.map((c) => [
          <span key="n" className="font-medium">{c.nome}</span>,
          <span key="d" className="font-mono text-xs">{formatDocumento(c.documento)}</span>,
          <span key="t" className="text-[var(--muted)]">{formatTelefone(c.telefone) || "—"}</span>,
          <span key="b" className="text-[var(--muted)]">{c.banco?.banco || "—"}</span>,
          c.ativo ? (
            <Badge key="s" variant="success">Ativo</Badge>
          ) : (
            <Badge key="s" variant="neutral">Inativo</Badge>
          ),
          <Link
            key="a"
            href={`/dashboard/cessionarios/${c.id}/editar`}
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Editar
          </Link>,
        ])}
      />
    </div>
  );
}
