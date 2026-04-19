"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface PerfilActionResult {
  error: string | null;
  ok?: boolean;
  mensagem?: string;
}

/* ============================================================
 * DADOS PESSOAIS: nome, OAB
 * ============================================================ */

const dadosSchema = z.object({
  nome: z.string().trim().min(3, "Nome muito curto"),
  oab: z.string().trim().optional().or(z.literal("")),
});

export async function atualizarDadosPerfil(
  _prev: PerfilActionResult,
  formData: FormData,
): Promise<PerfilActionResult> {
  const parsed = dadosSchema.safeParse({
    nome: formData.get("nome"),
    oab: formData.get("oab"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({
      nome: parsed.data.nome,
      oab: parsed.data.oab || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Também atualiza user_metadata no Supabase Auth (usado na tela de boas-vindas)
  await supabase.auth.updateUser({
    data: { nome: parsed.data.nome },
  });

  revalidatePath("/dashboard", "layout");
  return { error: null, ok: true, mensagem: "Dados atualizados" };
}

/* ============================================================
 * ALTERAR E-MAIL (requer confirmação via link no e-mail novo)
 * ============================================================ */

const emailSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  senha_atual: z.string().min(1, "Confirme sua senha atual"),
});

export async function alterarEmail(
  _prev: PerfilActionResult,
  formData: FormData,
): Promise<PerfilActionResult> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
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

  // Valida senha atual — evita que alguém com sessão aberta altere o e-mail.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.senha_atual,
  });
  if (authError) {
    return { error: "Senha atual incorreta." };
  }

  if (parsed.data.email === user.email) {
    return { error: "O novo e-mail é igual ao atual." };
  }

  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("duplicate")
    ) {
      return { error: "Este e-mail já está em uso por outra conta." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/perfil", "layout");
  return {
    error: null,
    ok: true,
    mensagem:
      "Enviamos um link de confirmação para o novo e-mail. Clique nele para concluir a troca.",
  };
}

/* ============================================================
 * ALTERAR SENHA (valida senha atual antes)
 * ============================================================ */

const senhaSchema = z
  .object({
    senha_atual: z.string().min(1, "Informe a senha atual"),
    nova_senha: z
      .string()
      .min(8, "A nova senha deve ter ao menos 8 caracteres"),
    confirmacao: z.string(),
  })
  .refine((d) => d.nova_senha === d.confirmacao, {
    message: "A confirmação não confere",
    path: ["confirmacao"],
  })
  .refine((d) => d.nova_senha !== d.senha_atual, {
    message: "A nova senha deve ser diferente da atual",
    path: ["nova_senha"],
  });

export async function alterarSenha(
  _prev: PerfilActionResult,
  formData: FormData,
): Promise<PerfilActionResult> {
  const parsed = senhaSchema.safeParse({
    senha_atual: formData.get("senha_atual"),
    nova_senha: formData.get("nova_senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Sessão expirada." };

  // Revalida com a senha atual antes de permitir troca.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.senha_atual,
  });
  if (authError) {
    return { error: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.nova_senha,
  });

  if (error) return { error: error.message };

  return {
    error: null,
    ok: true,
    mensagem: "Senha alterada com sucesso.",
  };
}
