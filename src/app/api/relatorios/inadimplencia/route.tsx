import { renderToStream } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConfiguracoes } from "@/lib/configuracoes";
import { InadimplenciaPDF } from "@/lib/pdf/inadimplencia-pdf";
import type { InadimplenciaItem } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const [{ data, error }, config] = await Promise.all([
    supabase
      .from("v_inadimplencia")
      .select("*")
      .returns<InadimplenciaItem[]>(),
    getConfiguracoes(),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const emitidoEm = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const stream = await renderToStream(
    <InadimplenciaPDF itens={data ?? []} emitidoEm={emitidoEm} config={config} />,
  );

  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="inadimplencia-${new Date().toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
