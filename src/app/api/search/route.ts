import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { digits } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SearchResult {
  tipo: "cliente" | "cessionario" | "cessao";
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] as SearchResult[] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const onlyDigits = digits(q);
  const likeQ = `%${q}%`;
  const likeDoc = onlyDigits.length >= 3 ? `%${onlyDigits}%` : likeQ;

  const [clientesRes, cessionariosRes, cessoesRes] = await Promise.all([
    supabase
      .from("clientes_principais")
      .select("id, nome, documento")
      .or(`nome.ilike.${likeQ},documento.ilike.${likeDoc}`)
      .limit(5),
    supabase
      .from("cessionarios")
      .select("id, nome, documento")
      .or(`nome.ilike.${likeQ},documento.ilike.${likeDoc}`)
      .limit(5),
    supabase
      .from("v_cessoes_resumo")
      .select("id, numero_contrato, cliente_nome, cessionario_nome")
      .or(
        `numero_contrato.ilike.${likeQ},cliente_nome.ilike.${likeQ},cessionario_nome.ilike.${likeQ}`,
      )
      .limit(10),
  ]);

  const results: SearchResult[] = [];

  for (const c of clientesRes.data ?? []) {
    results.push({
      tipo: "cliente",
      id: c.id,
      titulo: c.nome,
      subtitulo: `Cliente · ${c.documento}`,
      href: `/dashboard/clientes/${c.id}`,
    });
  }
  for (const c of cessionariosRes.data ?? []) {
    results.push({
      tipo: "cessionario",
      id: c.id,
      titulo: c.nome,
      subtitulo: `Cessionário · ${c.documento}`,
      href: `/dashboard/cessionarios/${c.id}`,
    });
  }
  for (const c of cessoesRes.data ?? []) {
    results.push({
      tipo: "cessao",
      id: c.id,
      titulo: `Contrato ${c.numero_contrato}`,
      subtitulo: `${c.cliente_nome} → ${c.cessionario_nome}`,
      href: `/dashboard/cessoes/${c.id}`,
    });
  }

  return NextResponse.json({ results });
}
