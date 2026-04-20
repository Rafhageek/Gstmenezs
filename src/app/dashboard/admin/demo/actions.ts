"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface DemoResult {
  ok: boolean;
  mensagem: string;
  detalhes?: Record<string, number>;
}

export async function popularDemo(): Promise<DemoResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("popular_dados_demo");

  if (error) {
    return { ok: false, mensagem: `Erro: ${error.message}` };
  }

  const payload = data as {
    ok: boolean;
    clientes: number;
    cessionarios: number;
    cessoes: number;
  } | null;

  revalidatePath("/dashboard/admin/demo");
  revalidatePath("/dashboard", "layout");

  return {
    ok: true,
    mensagem: "Dados demo populados com sucesso.",
    detalhes: payload
      ? {
          clientes: payload.clientes,
          cessionarios: payload.cessionarios,
          cessoes: payload.cessoes,
        }
      : undefined,
  };
}

export async function limparDemo(): Promise<DemoResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("limpar_dados_demo");

  if (error) {
    return { ok: false, mensagem: `Erro: ${error.message}` };
  }

  const payload = data as {
    ok: boolean;
    pagamentos_apagados: number;
    cessoes_apagadas: number;
    cessionarios_apagados: number;
    clientes_apagados: number;
  } | null;

  revalidatePath("/dashboard/admin/demo");
  revalidatePath("/dashboard", "layout");

  return {
    ok: true,
    mensagem: "Dados demo apagados com sucesso.",
    detalhes: payload
      ? {
          pagamentos: payload.pagamentos_apagados,
          cessoes: payload.cessoes_apagadas,
          cessionarios: payload.cessionarios_apagados,
          clientes: payload.clientes_apagados,
        }
      : undefined,
  };
}
