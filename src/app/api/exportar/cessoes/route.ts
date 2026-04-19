import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCSV, nomeArquivoData } from "@/lib/csv";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { CessaoResumo } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const status = searchParams.get("status");

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((c) => [
    c.numero_contrato,
    c.cliente_nome,
    c.cessionario_nome,
    formatDataBR(c.data_cessao),
    formatDataBR(c.data_vencimento_inicial),
    formatBRL(c.valor_total),
    formatBRL(c.valor_pago),
    formatBRL(c.saldo_devedor),
    `${c.percentual_pago.toFixed(2)}%`,
    traduzirStatus(c.status),
    c.primeira_parcela_atrasada ? "Sim" : "Não",
  ]);

  const csv = toCSV(
    [
      "Contrato",
      "Cliente",
      "Cessionário",
      "Data da cessão",
      "1º vencimento",
      "Valor total",
      "Pago",
      "Saldo devedor",
      "% Pago",
      "Status",
      "Em atraso",
    ],
    rows,
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivoData("cessoes")}"`,
      "Cache-Control": "no-store",
    },
  });
}

function traduzirStatus(s: CessaoResumo["status"]): string {
  return { ativa: "Ativa", quitada: "Quitada", inadimplente: "Inadimplente", cancelada: "Cancelada" }[s];
}
