import { NextResponse, type NextRequest } from "next/server";
import { validarTokenPortal } from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // Busca o pagamento + cessao para validar escopo do cliente.
  const { data, error } = await admin
    .from("pagamentos")
    .select(
      `id, comprovante_url, cessao:cessoes_credito!inner(cliente_principal_id)`,
    )
    .eq("id", id)
    .single<{
      id: string;
      comprovante_url: string | null;
      cessao: { cliente_principal_id: string };
    }>();

  if (error || !data) {
    return NextResponse.json(
      { error: "Pagamento não encontrado" },
      { status: 404 },
    );
  }

  // Isolamento: só serve comprovantes do cliente deste token.
  if (data.cessao.cliente_principal_id !== contexto.cliente_id) {
    return NextResponse.json(
      { error: "Pagamento fora do escopo deste link" },
      { status: 403 },
    );
  }

  if (!data.comprovante_url) {
    return NextResponse.json(
      { error: "Este pagamento não tem comprovante anexado" },
      { status: 404 },
    );
  }

  const { data: signed, error: signErr } = await admin.storage
    .from("comprovantes")
    .createSignedUrl(data.comprovante_url, 60 * 5);

  if (signErr || !signed) {
    return NextResponse.json(
      { error: "Não foi possível gerar o link do comprovante" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
