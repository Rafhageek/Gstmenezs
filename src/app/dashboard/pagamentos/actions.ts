"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  registrarPagamentoSchema,
  estornarPagamentoSchema,
} from "@/lib/validations/pagamento";

export interface PagamentoActionResult {
  error: string | null;
  ok?: boolean;
}

export async function registrarPagamento(
  formData: FormData,
): Promise<PagamentoActionResult> {
  const isParcial = formData.get("parcial") === "true";

  const parsed = registrarPagamentoSchema.safeParse({
    pagamento_id: formData.get("pagamento_id"),
    data_pagamento: formData.get("data_pagamento"),
    valor: formData.get("valor") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();

  // Se for parcial, usa RPC que gera parcela de saldo automaticamente
  if (isParcial && parsed.data.valor) {
    const { error } = await supabase.rpc("registrar_pagamento_parcial", {
      p_pagamento_id: parsed.data.pagamento_id,
      p_data_pagamento: parsed.data.data_pagamento,
      p_valor_recebido: parsed.data.valor,
      p_observacoes: parsed.data.observacoes ?? null,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.rpc("registrar_pagamento", {
      p_pagamento_id: parsed.data.pagamento_id,
      p_data_pagamento: parsed.data.data_pagamento,
      p_valor: parsed.data.valor ?? null,
      p_observacoes: parsed.data.observacoes ?? null,
    });
    if (error) return { error: error.message };
  }

  // Upload de comprovante (opcional)
  const comprovante = formData.get("comprovante") as File | null;
  if (comprovante && comprovante.size > 0) {
    const ext = comprovante.name.split(".").pop() || "pdf";
    const path = `${parsed.data.pagamento_id}/${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await comprovante.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("comprovantes")
      .upload(path, bytes, {
        contentType: comprovante.type,
        upsert: false,
      });
    if (upErr) {
      return { error: `Pagamento registrado, mas falha no upload: ${upErr.message}` };
    }
    await supabase
      .from("pagamentos")
      .update({ comprovante_url: path })
      .eq("id", parsed.data.pagamento_id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cessoes", "layout");
  revalidatePath("/dashboard/pagamentos");
  return { error: null, ok: true };
}

export async function estornarPagamento(
  formData: FormData,
): Promise<PagamentoActionResult> {
  const parsed = estornarPagamentoSchema.safeParse({
    pagamento_id: formData.get("pagamento_id"),
    motivo: formData.get("motivo"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("estornar_pagamento", {
    p_pagamento_id: parsed.data.pagamento_id,
    p_motivo: parsed.data.motivo,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cessoes", "layout");
  revalidatePath("/dashboard/pagamentos");
  return { error: null, ok: true };
}

export async function getComprovanteUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("comprovantes")
    .createSignedUrl(path, 60 * 5); // 5 minutos
  if (error) return null;
  return data.signedUrl;
}

export async function atualizarParcela(
  formData: FormData,
): Promise<PagamentoActionResult> {
  const pagamento_id = String(formData.get("pagamento_id") ?? "");
  const valor = Number(formData.get("valor") ?? 0);
  const data_vencimento = String(formData.get("data_vencimento") ?? "");
  const observacoes = String(formData.get("observacoes") ?? "");

  if (!pagamento_id || valor <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data_vencimento)) {
    return { error: "Preencha valor e vencimento corretamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("atualizar_parcela", {
    p_pagamento_id: pagamento_id,
    p_valor: valor,
    p_data_vencimento: data_vencimento,
    p_observacoes: observacoes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cessoes", "layout");
  revalidatePath("/dashboard/pagamentos");
  return { error: null, ok: true };
}
