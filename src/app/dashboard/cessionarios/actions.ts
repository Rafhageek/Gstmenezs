"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cessionarioSchema } from "@/lib/validations/cessionario";

export interface CessionarioFormState {
  error: string | null;
  fieldErrors: Record<string, string>;
}

const initial: CessionarioFormState = { error: null, fieldErrors: {} };

function parseBanco(formData: FormData) {
  const banco = String(formData.get("banco_nome") ?? "").trim();
  const agencia = String(formData.get("agencia") ?? "").trim();
  const conta = String(formData.get("conta") ?? "").trim();
  const tipo = String(formData.get("tipo_conta") ?? "").trim();
  const pix = String(formData.get("pix") ?? "").trim();
  if (!banco && !agencia && !conta && !pix) return undefined;
  return {
    banco,
    agencia,
    conta,
    tipo: tipo === "corrente" || tipo === "poupanca" ? tipo : undefined,
    pix,
  };
}

function getDados(formData: FormData) {
  const tipoPessoa = String(formData.get("tipo_pessoa") ?? "PJ");
  return {
    nome: String(formData.get("nome") ?? ""),
    documento: String(formData.get("documento") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    banco: parseBanco(formData),
    observacoes: String(formData.get("observacoes") ?? ""),
    ativo: formData.get("ativo") === "on" || formData.get("ativo") === "true",
    tipo_pessoa: (tipoPessoa === "PF" ? "PF" : "PJ") as "PF" | "PJ",
    data_contrato: String(formData.get("data_contrato") ?? ""),
    valor_contratado: String(formData.get("valor_contratado") ?? ""),
    valor_cessao: String(formData.get("valor_cessao") ?? ""),
    percentual: String(formData.get("percentual") ?? ""),
  };
}

export async function criarCessionario(
  _prev: CessionarioFormState,
  formData: FormData,
): Promise<CessionarioFormState> {
  const parsed = cessionarioSchema.safeParse(getDados(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...initial, error: "Sessão expirada." };

  const { error } = await supabase.from("cessionarios").insert({
    ...parsed.data,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ...initial,
        fieldErrors: { documento: "Já existe cessionário com esse CPF/CNPJ." },
      };
    }
    return { ...initial, error: error.message };
  }

  revalidatePath("/dashboard/cessionarios");
  redirect("/dashboard/cessionarios");
}

export async function atualizarCessionario(
  id: string,
  _prev: CessionarioFormState,
  formData: FormData,
): Promise<CessionarioFormState> {
  const parsed = cessionarioSchema.safeParse(getDados(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("cessionarios")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ...initial, error: error.message };

  revalidatePath("/dashboard/cessionarios");
  revalidatePath(`/dashboard/cessionarios/${id}`);
  redirect("/dashboard/cessionarios");
}

function toFieldErrors(
  err: import("zod").ZodError,
): CessionarioFormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: null, fieldErrors };
}
