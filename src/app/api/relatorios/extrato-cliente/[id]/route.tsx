import { renderToStream } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConfiguracoes } from "@/lib/configuracoes";
import { ExtratoClientePDF } from "@/lib/pdf/extrato-cliente-pdf";
import type {
  ClientePrincipal,
  ExtratoCliente,
  CessaoResumo,
} from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const [clienteRes, extratoRes, cessoesIdsRes, config] = await Promise.all([
    supabase
      .from("clientes_principais")
      .select("*")
      .eq("id", id)
      .single<ClientePrincipal>(),
    supabase
      .from("v_extrato_cliente")
      .select("*")
      .eq("cliente_id", id)
      .single<ExtratoCliente>(),
    supabase
      .from("cessoes_credito")
      .select("id")
      .eq("cliente_principal_id", id)
      .returns<{ id: string }[]>(),
    getConfiguracoes(),
  ]);

  const cessaoIds = (cessoesIdsRes.data ?? []).map((c) => c.id);
  const cessoesRes = cessaoIds.length
    ? await supabase
        .from("v_cessoes_resumo")
        .select("*")
        .in("id", cessaoIds)
        .order("data_cessao", { ascending: false })
        .returns<CessaoResumo[]>()
    : { data: [] as CessaoResumo[], error: null };

  if (clienteRes.error || !clienteRes.data) {
    return NextResponse.json(
      { error: "Cliente não encontrado" },
      { status: 404 },
    );
  }

  const cliente = clienteRes.data;
  const extrato = extratoRes.data ?? {
    cliente_id: cliente.id,
    cliente_nome: cliente.nome,
    cliente_documento: cliente.documento,
    total_cessoes: 0,
    cessoes_ativas: 0,
    cessoes_quitadas: 0,
    volume_total: 0,
    total_recebido: 0,
    saldo_devedor: 0,
  };

  const cessoes = cessoesRes.data ?? [];

  const emitidoEm = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const stream = await renderToStream(
    <ExtratoClientePDF
      cliente={cliente}
      extrato={extrato}
      cessoes={cessoes}
      emitidoEm={emitidoEm}
      config={config}
    />,
  );

  return new NextResponse(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="extrato-${cliente.nome.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
