"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const PENDING_COOKIE = "mnz_2fa_pending";
const PENDING_DURATION_MIN = 15;

async function setarPending2fa() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: PENDING_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_DURATION_MIN * 60,
  });
  // Garante que não há unlock ativo — 2FA precisa ser concluído primeiro
  cookieStore.delete("mnz_unlock_at");
  cookieStore.delete("mnz_2fa_tentativas");
}

export interface AuthFormState {
  error: string | null;
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  // Sessão Supabase criada. Agora exige 2FA antes de liberar o sistema.
  await setarPending2fa();

  revalidatePath("/", "layout");
  redirect("/verificacao-2fa");
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();

  if (!email || !password || !nome) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (password.length < 8) {
    return { error: "A senha deve ter ao menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
    },
  });

  if (error) {
    return { error: traduzirErroAuth(error.message) };
  }

  return {
    error:
      "Conta criada. Verifique seu e-mail para confirmar antes de entrar.",
  };
}

function traduzirErroAuth(msg: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed":
      "Confirme seu e-mail antes de entrar (link enviado pelo Supabase).",
    "User already registered": "Este e-mail já está cadastrado.",
  };
  return map[msg] ?? msg;
}
