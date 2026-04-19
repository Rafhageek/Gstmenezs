"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { PortalLink, UserRole } from "@/types/database";

export interface PortalActionResult {
  error: string | null;
  token?: string;
  linkId?: string;
}

const novoLinkSchema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  descricao: z.string().trim().min(3, "Descreva para quem é o link"),
  validade_dias: z.coerce
    .number()
    .int()
    .min(0, "Validade inválida")
    .max(365, "Máximo 365 dias"),
});

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
    return { error: "Apenas administradores." };
  }
  return { ok: true };
}

export async function criarLinkPortal(
  formData: FormData,
): Promise<PortalActionResult> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };

  const parsed = novoLinkSchema.safeParse({
    cliente_id: formData.get("cliente_id"),
    descricao: formData.get("descricao"),
    validade_dias: formData.get("validade_dias"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("criar_portal_link", {
      p_cliente_id: parsed.data.cliente_id,
      p_descricao: parsed.data.descricao,
      p_validade_dias:
        parsed.data.validade_dias === 0 ? null : parsed.data.validade_dias,
    })
    .single<PortalLink>();

  if (error || !data) {
    return { error: error?.message ?? "Falha ao criar link" };
  }

  revalidatePath("/dashboard/admin/portal");
  return { error: null, token: data.token, linkId: data.id };
}

export async function revogarLinkPortal(
  linkId: string,
): Promise<PortalActionResult> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("revogar_portal_link", {
    p_link_id: linkId,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/portal");
  return { error: null };
}
