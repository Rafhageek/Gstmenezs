import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCSV, nomeArquivoData } from "@/lib/csv";
import { formatBRL, formatDataBR } from "@/lib/format";
import type {
  Pagamento,
  CessaoCredito,
  ClientePrincipal,
  Cessionario,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PagamentoFull extends Pagamento {
  cessao: Pick<CessaoCredito, "numero_contrato"> & {
    cliente_principal: Pick<ClientePrincipal, "nome">;
    cessionario: Pick<Cessionario, "nome">;
  };
}

export async function GET() {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("pagamentos")
    .select(
      `*, cessao:cessoes_credito!inner(numero_contrato, cliente_principal:clientes_principais!inner(nome), cessionario:cessionarios!inner(nome))`,
    )
    .order("data_vencimento", { ascending: true })
    .returns<PagamentoFull[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((p) => {
    const status = p.is_reversal
      ? "Estorno"
      : p.data_pagamento
        ? "Pago"
        : p.data_vencimento < hoje
          ? "Atrasado"
          : "Aberto";
    return [
      p.cessao.numero_contrato,
      p.cessao.cliente_principal.nome,
      p.cessao.cessionario.nome,
      p.numero_parcela,
      formatDataBR(p.data_vencimento),
      formatDataBR(p.data_pagamento),
      `${p.is_reversal ? "-" : ""}${formatBRL(p.valor)}`,
      status,
      p.tipo,
      p.observacoes ?? "",
    ];
  });

  const csv = toCSV(
    [
      "Contrato",
      "Cliente",
      "Cessionário",
      "Parcela",
      "Vencimento",
      "Pago em",
      "Valor",
      "Status",
      "Tipo",
      "Observações",
    ],
    rows,
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivoData("pagamentos")}"`,
      "Cache-Control": "no-store",
    },
  });
}
