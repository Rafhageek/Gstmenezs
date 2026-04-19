"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

const ROLES: UserRole[] = ["admin", "financeiro", "contador"];

export interface UsuarioActionResult {
  error: string | null;
  ok?: boolean;
}

const novoUsuarioSchema = z.object({
  nome: z.string().trim().min(3, "Nome muito curto"),
  email: z.string().trim().email("E-mail inválido"),
  senha: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres"),
  role: z.enum(["admin", "financeiro", "contador"]),
  oab: z.string().trim().optional().or(z.literal("")),
});

/**
 * Garante que o usuário corrente é admin antes de executar
 * qualquer operação privilegiada.
 */
async function requireAdmin(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();
  if (profile?.role !== "admin") {
    return { error: "Acesso negado: somente administradores." };
  }
  return { ok: true };
}

export async function criarUsuario(
  formData: FormData,
): Promise<UsuarioActionResult> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };

  const parsed = novoUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    role: formData.get("role"),
    oab: formData.get("oab") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const { nome, email, senha, role, oab } = parsed.data;
  const admin = createAdminClient();

  // Cria no Auth (já confirmado, sem necessidade de e-mail)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (createErr) return { error: createErr.message };

  // O trigger handle_new_user já criou o profile com role default 'financeiro'.
  // Atualiza para o role escolhido + OAB.
  const { error: updErr } = await admin
    .from("profiles")
    .update({ role, oab: oab || null, nome })
    .eq("id", created.user.id);

  if (updErr) return { error: updErr.message };

  revalidatePath("/dashboard/admin/usuarios");
  return { error: null, ok: true };
}

export async function atualizarRole(
  userId: string,
  novoRole: UserRole,
): Promise<UsuarioActionResult> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };
  if (!ROLES.includes(novoRole)) return { error: "Role inválido." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: novoRole })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/usuarios");
  return { error: null, ok: true };
}

export async function alternarAtivo(
  userId: string,
  ativo: boolean,
): Promise<UsuarioActionResult> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ ativo })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/usuarios");
  return { error: null, ok: true };
}

export async function resetarSenha(
  userId: string,
  novaSenha: string,
): Promise<UsuarioActionResult> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };

  if (novaSenha.length < 8) {
    return { error: "Senha deve ter ao menos 8 caracteres." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: novaSenha,
  });

  if (error) return { error: error.message };
  return { error: null, ok: true };
}
