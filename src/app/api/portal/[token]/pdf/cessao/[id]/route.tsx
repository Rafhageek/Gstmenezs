import { renderToStream } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { validarTokenPortal } from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConfiguracoes } from "@/lib/configuracoes";
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
    "id" | "nome" | "documento" | "email" | "telefone"
  >;
  cessionario: Pick<
    Cessionario,
    "nome" | "documento" | "email" | "telefone"
  >;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> },
) {
  const { token, id } = await params;
  const contexto = await validarTokenPortal(token);
  if (!contexto) {
    return NextResponse.json(
      { error: "Link inválido ou expirado" },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  const [cessaoRes, parcelasRes, config] = await Promise.all([
    admin
      .from("cessoes_credito")
      .select(
        `*, cliente_principal:clientes_principais(id,nome,documento,email,telefone), cessionario:cessionarios(nome,documento,email,telefone)`,
      )
      .eq("id", id)
      .single<CessaoFull>(),
    admin
      .from("pagamentos")
      .select("*")
      .eq("cessao_id", id)
      .order("numero_parcela", { ascending: true })
      .returns<Pagamento[]>(),
    getConfiguracoes(),
  ]);

  if (cessaoRes.error || !cessaoRes.data) {
    return NextResponse.json(
      { error: "Cessão não encontrada" },
      { status: 404 },
    );
  }

  const cessao = cessaoRes.data;

  // CRÍTICO: Garante que a cessão pertence ao cliente do token.
  // Sem essa checagem, qualquer contador poderia ver cessões de outros clientes.
  if (cessao.cliente_principal.id !== contexto.cliente_id) {
    return NextResponse.json(
      { error: "Cessão fora do escopo deste link" },
      { status: 403 },
    );
  }

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
      config={config}
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
