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

/** Limite de tamanho para uploads de comprovante (5 MB). */
const MAX_COMPROVANTE_BYTES = 5 * 1024 * 1024;
const TIPOS_ACEITOS = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

function validarArquivo(file: File): string | null {
  if (file.size > MAX_COMPROVANTE_BYTES) {
    return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo permitido: 5 MB.`;
  }
  // Alguns browsers não enviam contentType confiável — aceitamos se extensão bate
  if (file.type && !TIPOS_ACEITOS.includes(file.type)) {
    return `Tipo de arquivo não permitido (${file.type}). Use PDF, JPG, PNG, WEBP ou HEIC.`;
  }
  return null;
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
    const erroValidacao = validarArquivo(comprovante);
    if (erroValidacao) {
      return { error: `Pagamento registrado, mas: ${erroValidacao}` };
    }
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

/** Gera signed URLs em batch pra vários comprovantes de uma vez. */
export async function getComprovantesUrls(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("comprovantes")
    .createSignedUrls(paths, 60 * 5); // 5 minutos
  if (error || !data) return {};
  const mapa: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) {
      mapa[item.path] = item.signedUrl;
    }
  }
  return mapa;
}

/**
 * Anexa ou substitui um comprovante de pagamento JÁ registrado.
 * Útil quando o comprovante chega depois (ex.: contador manda via WhatsApp horas depois).
 */
export async function anexarComprovantePosterior(
  formData: FormData,
): Promise<PagamentoActionResult> {
  const pagamento_id = String(formData.get("pagamento_id") ?? "");
  const arquivo = formData.get("comprovante") as File | null;

  if (!pagamento_id) return { error: "ID do pagamento ausente." };
  if (!arquivo || arquivo.size === 0)
    return { error: "Nenhum arquivo selecionado." };

  const erroValidacao = validarArquivo(arquivo);
  if (erroValidacao) return { error: erroValidacao };

  const supabase = await createClient();

  // Só aceita anexar em pagamentos já registrados (com data_pagamento)
  const { data: pagamento, error: lerErr } = await supabase
    .from("pagamentos")
    .select("id, data_pagamento, comprovante_url")
    .eq("id", pagamento_id)
    .single<{
      id: string;
      data_pagamento: string | null;
      comprovante_url: string | null;
    }>();

  if (lerErr || !pagamento) {
    return { error: "Pagamento não encontrado." };
  }
  if (!pagamento.data_pagamento) {
    return {
      error: "Só é possível anexar comprovante em pagamentos já registrados.",
    };
  }

  const ext = arquivo.name.split(".").pop() || "pdf";
  const path = `${pagamento_id}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await arquivo.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("comprovantes")
    .upload(path, bytes, {
      contentType: arquivo.type || undefined,
      upsert: false,
    });

  if (upErr) return { error: `Falha no upload: ${upErr.message}` };

  // Remove o anterior (se existia) pra não deixar lixo no storage
  if (pagamento.comprovante_url) {
    await supabase.storage
      .from("comprovantes")
      .remove([pagamento.comprovante_url]);
  }

  const { error: updErr } = await supabase
    .from("pagamentos")
    .update({ comprovante_url: path })
    .eq("id", pagamento_id);

  if (updErr) return { error: updErr.message };

  revalidatePath("/dashboard/cessoes", "layout");
  revalidatePath("/dashboard/pagamentos");
  return { error: null, ok: true };
}

/** Remove o comprovante anexado (sem afetar o pagamento em si). */
export async function removerComprovante(
  pagamento_id: string,
): Promise<PagamentoActionResult> {
  if (!pagamento_id) return { error: "ID ausente." };
  const supabase = await createClient();

  const { data: pag } = await supabase
    .from("pagamentos")
    .select("comprovante_url")
    .eq("id", pagamento_id)
    .single<{ comprovante_url: string | null }>();

  if (pag?.comprovante_url) {
    await supabase.storage.from("comprovantes").remove([pag.comprovante_url]);
  }

  const { error } = await supabase
    .from("pagamentos")
    .update({ comprovante_url: null })
    .eq("id", pagamento_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/cessoes", "layout");
  revalidatePath("/dashboard/pagamentos");
  return { error: null, ok: true };
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
