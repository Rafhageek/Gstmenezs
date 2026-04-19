import { renderToStream } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CessaoPDF } from "@/lib/pdf/cessao-pdf";
import type {
  CessaoCredito,
  ClientePrincipal,
  Cessionario,
  Pagamento,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CessaoFull extends CessaoCredito {
  cliente_principal: Pick<
    ClientePrincipal,
    "nome" | "documento" | "email" | "telefone"
  >;
  cessionario: Pick<
    Cessionario,
    "nome" | "documento" | "email" | "telefone"
  >;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const [cessaoRes, parcelasRes] = await Promise.all([
    supabase
      .from("cessoes_credito")
      .select(
        `*, cliente_principal:clientes_principais(nome,documento,email,telefone), cessionario:cessionarios(nome,documento,email,telefone)`,
      )
      .eq("id", id)
      .single<CessaoFull>(),
    supabase
      .from("pagamentos")
      .select("*")
      .eq("cessao_id", id)
      .order("numero_parcela", { ascending: true })
      .returns<Pagamento[]>(),
  ]);

  if (cessaoRes.error || !cessaoRes.data) {
    return NextResponse.json(
      { error: "Cessão não encontrada" },
      { status: 404 },
    );
  }

  const cessao = cessaoRes.data;
  const parcelas = parcelasRes.data ?? [];
  const emitidoEm = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const stream = await renderToStream(
    <CessaoPDF
      cessao={cessao}
      cliente={cessao.cliente_principal}
      cessionario={cessao.cessionario}
      parcelas={parcelas}
      emitidoEm={emitidoEm}
    />,
  );

  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cessao-${cessao.numero_contrato.replace(/\//g, "-")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
