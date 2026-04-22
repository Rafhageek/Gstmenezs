import { renderToStream } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConfiguracoes } from "@/lib/configuracoes";
import { ExtratoCessionarioPDF } from "@/lib/pdf/extrato-cessionario-pdf";
import type { Cessionario, CessaoResumo } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const [cessionarioRes, cessoesRes, config] = await Promise.all([
    supabase
      .from("cessionarios")
      .select("*")
      .eq("id", id)
      .single<Cessionario>(),
    supabase
      .from("v_cessoes_resumo")
      .select("*")
      .eq("cessionario_id", id)
      .order("data_cessao", { ascending: false })
      .returns<CessaoResumo[]>(),
    getConfiguracoes(),
  ]);

  if (cessionarioRes.error || !cessionarioRes.data) {
    return NextResponse.json(
      { error: "Cessionário não encontrado" },
      { status: 404 },
    );
  }

  const cessionario = cessionarioRes.data;
  const cessoes = cessoesRes.data ?? [];

  const totais = cessoes.reduce(
    (acc, c) => {
      acc.volume += Number(c.valor_total);
      acc.recebido += Number(c.valor_pago);
      acc.saldo += Number(c.saldo_devedor);
      return acc;
    },
    { volume: 0, recebido: 0, saldo: 0 },
  );

  const emitidoEm = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const stream = await renderToStream(
    <ExtratoCessionarioPDF
      cessionario={cessionario}
      cessoes={cessoes}
      totais={totais}
      emitidoEm={emitidoEm}
      config={config}
    />,
  );

  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="extrato-cessionario-${cessionario.nome.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
