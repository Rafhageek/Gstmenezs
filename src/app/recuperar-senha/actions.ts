"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface RecuperarSenhaState {
  error: string | null;
  ok: boolean;
}

const schema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export async function solicitarRecuperacao(
  _prev: RecuperarSenhaState,
  formData: FormData,
): Promise<RecuperarSenhaState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, ok: false };
  }

  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    `https://${hdrs.get("host") ?? "painelmnz.vercel.app"}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/recuperar-senha/nova`,
    },
  );

  // Resposta neutra para não vazar se e-mail existe ou não (boa prática)
  if (error) {
    console.error("[recuperar-senha] resetPasswordForEmail:", error.message);
  }

  return {
    error: null,
    ok: true,
  };
}

const novaSenhaSchema = z
  .object({
    senha: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  });

export async function definirNovaSenha(
  _prev: RecuperarSenhaState,
  formData: FormData,
): Promise<RecuperarSenhaState> {
  const parsed = novaSenhaSchema.safeParse({
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Link expirado ou inválido. Solicite um novo e-mail.",
      ok: false,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.senha,
  });
  if (error) return { error: error.message, ok: false };

  return { error: null, ok: true };
}
