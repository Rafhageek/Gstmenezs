"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface SegurancaActionResult {
  error: string | null;
  ok?: boolean;
  mensagem?: string;
}

const definirSchema = z
  .object({
    pergunta: z
      .string()
      .trim()
      .min(5, "Pergunta muito curta (mínimo 5 caracteres)"),
    resposta: z
      .string()
      .trim()
      .min(3, "Resposta muito curta (mínimo 3 caracteres)"),
    confirmacao: z.string().trim(),
    senha_atual: z.string().min(1, "Confirme sua senha atual"),
  })
  .refine((d) => d.resposta === d.confirmacao, {
    message: "A confirmação da resposta não confere",
    path: ["confirmacao"],
  });

export async function definirPerguntaSeguranca(
  _prev: SegurancaActionResult,
  formData: FormData,
): Promise<SegurancaActionResult> {
  const parsed = definirSchema.safeParse({
    pergunta: formData.get("pergunta"),
    resposta: formData.get("resposta"),
    confirmacao: formData.get("confirmacao"),
    senha_atual: formData.get("senha_atual"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Sessão expirada." };

  // Revalida senha atual
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.senha_atual,
  });
  if (authErr) return { error: "Senha atual incorreta." };

  const { error } = await supabase.rpc("definir_pergunta_seguranca", {
    p_pergunta: parsed.data.pergunta,
    p_resposta: parsed.data.resposta,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/perfil", "layout");
  return {
    error: null,
    ok: true,
    mensagem: "Pergunta de segurança atualizada",
  };
}

export async function removerPerguntaSeguranca(): Promise<SegurancaActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase.rpc("remover_pergunta_seguranca");
  if (error) return { error: error.message };

  revalidatePath("/dashboard/perfil", "layout");
  return {
    error: null,
    ok: true,
    mensagem: "Pergunta removida. 2FA desativado.",
  };
}
