import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { Pagamento, CessaoCredito, ClientePrincipal } from "@/types/database";

export const metadata = {
  title: "Pagamentos — Painel MNZ",
};

interface SearchParams {
  filtro?: "todos" | "atrasados" | "pagos" | "abertos";
}

interface PagamentoRow extends Pagamento {
  cessao: Pick<CessaoCredito, "numero_contrato"> & {
    cliente_principal: Pick<ClientePrincipal, "nome">;
  };
}

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { filtro = "todos" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("pagamentos")
    .select(
      `*, cessao:cessoes_credito!inner(numero_contrato, cliente_principal:clientes_principais!inner(nome))`,
    )
    .eq("is_reversal", false)
    .order("data_vencimento", { ascending: true });

  const hoje = new Date().toISOString().slice(0, 10);
  if (filtro === "atrasados") {
    query = query.is("data_pagamento", null).lt("data_vencimento", hoje);
  } else if (filtro === "pagos") {
    query = query.not("data_pagamento", "is", null);
  } else if (filtro === "abertos") {
    query = query.is("data_pagamento", null);
  }

  const { data, error } = await query.returns<PagamentoRow[]>();

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Operação" titulo="Pagamentos" />
        <p className="text-sm text-[var(--danger)]">Erro: {error.message}</p>
      </div>
    );
  }

  const pagamentos = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        titulo="Pagamentos"
        descricao="Todas as parcelas de todas as cessões. Use os filtros para focar."
      />

      <nav className="mb-6 flex flex-wrap gap-2">
        <FilterTab label="Todos" value="todos" current={filtro} />
        <FilterTab label="Em aberto" value="abertos" current={filtro} />
        <FilterTab label="Atrasados" value="atrasados" current={filtro} />
        <FilterTab label="Pagos" value="pagos" current={filtro} />
      </nav>

      <DataTable
        headers={[
          "Vencimento",
          "Cliente / Contrato",
          "Parcela",
          "Valor",
          "Pago em",
          "Status",
          "",
        ]}
        rows={pagamentos.map((p) => {
          const venc = new Date(p.data_vencimento);
          const hojeD = new Date();
          hojeD.setHours(0, 0, 0, 0);
          const atrasado = !p.data_pagamento && venc < hojeD;
          return [
            <span key="d" className="font-mono text-xs">
              {formatDataBR(p.data_vencimento)}
            </span>,
            <div key="c" className="leading-tight">
              <div className="font-medium">{p.cessao.cliente_principal.nome}</div>
              <div className="font-mono text-xs text-[var(--muted)]">
                {p.cessao.numero_contrato}
              </div>
            </div>,
            <span key="n" className="font-mono">
              {p.numero_parcela}
            </span>,
            <span key="v" className="font-mono">
              {formatBRL(p.valor)}
            </span>,
            <span key="pg" className="text-[var(--muted)]">
              {formatDataBR(p.data_pagamento)}
            </span>,
            p.data_pagamento ? (
              <Badge key="s" variant="success">Pago</Badge>
            ) : atrasado ? (
              <Badge key="s" variant="danger">Atrasado</Badge>
            ) : (
              <Badge key="s" variant="gold">Aberto</Badge>
            ),
            <Link
              key="a"
              href={`/dashboard/cessoes/${p.cessao_id}`}
              className="text-xs text-[var(--gold)] hover:underline"
            >
              Abrir cessão
            </Link>,
          ];
        })}
      />
    </div>
  );
}

function FilterTab({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  current: string;
}) {
  const active = value === current;
  return (
    <Link
      href={`/dashboard/pagamentos?filtro=${value}`}
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
