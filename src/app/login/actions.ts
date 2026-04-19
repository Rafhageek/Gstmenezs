"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath("/", "layout");
  redirect("/dashboard");
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
