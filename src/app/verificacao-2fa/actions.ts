"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const UNLOCK_COOKIE = "mnz_unlock_at";
const PENDING_COOKIE = "mnz_2fa_pending";
const TENTATIVAS_COOKIE = "mnz_2fa_tentativas";
const UNLOCK_DURATION_HOURS = 12;
const MAX_TENTATIVAS = 3;

export interface Verificacao2faState {
  error: string | null;
  tentativasRestantes?: number;
  bloqueado?: boolean;
}

const schema = z.object({
  resposta: z.string().min(1, "Informe a resposta"),
});

async function concederAcesso() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: UNLOCK_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UNLOCK_DURATION_HOURS * 60 * 60,
  });
  cookieStore.delete(PENDING_COOKIE);
  cookieStore.delete(TENTATIVAS_COOKIE);
}

export async function verificar2fa(
  _prev: Verificacao2faState,
  formData: FormData,
): Promise<Verificacao2faState> {
  const parsed = schema.safeParse({ resposta: formData.get("resposta") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const { data: ok, error: rpcError } = await supabase.rpc(
    "verificar_resposta_seguranca",
    { p_resposta: parsed.data.resposta },
  );

  if (rpcError) {
    return { error: "Erro ao verificar. Tente novamente." };
  }

  if (ok === true) {
    await concederAcesso();
    revalidatePath("/", "layout");
    redirect("/bem-vindo");
  }

  // Resposta errada — incrementa tentativas
  const cookieStore = await cookies();
  const atual = Number(cookieStore.get(TENTATIVAS_COOKIE)?.value ?? 0);
  const proxima = atual + 1;

  if (proxima >= MAX_TENTATIVAS) {
    // Força logout por segurança
    await supabase.auth.signOut();
    cookieStore.delete(PENDING_COOKIE);
    cookieStore.delete(TENTATIVAS_COOKIE);
    cookieStore.delete(UNLOCK_COOKIE);
    return {
      error: "Muitas tentativas incorretas. Faça login novamente.",
      bloqueado: true,
    };
  }

  cookieStore.set({
    name: TENTATIVAS_COOKIE,
    value: String(proxima),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });

  return {
    error: "Resposta incorreta. Tente novamente.",
    tentativasRestantes: MAX_TENTATIVAS - proxima,
  };
}

/** Usuário sem pergunta configurada — libera direto. */
export async function pularSeSemPergunta(): Promise<{ liberado: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { liberado: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("resposta_seguranca_hash")
    .eq("id", user.id)
    .single<{ resposta_seguranca_hash: string | null }>();

  if (!profile?.resposta_seguranca_hash) {
    await concederAcesso();
    return { liberado: true };
  }

  return { liberado: false };
}
