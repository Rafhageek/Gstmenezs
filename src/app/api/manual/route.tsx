import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getConfiguracoes } from "@/lib/configuracoes";
import { ManualPDF } from "@/lib/pdf/manual-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getConfiguracoes();
  const emitidoEm = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const stream = await renderToStream(
    <ManualPDF emitidoEm={emitidoEm} razaoSocial={config.razao_social} />,
  );

  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="manual-painel-financeiro.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
