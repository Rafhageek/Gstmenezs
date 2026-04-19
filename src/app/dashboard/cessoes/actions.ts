"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cessaoSchema } from "@/lib/validations/cessao";

export interface CessaoFormState {
  error: string | null;
  fieldErrors: Record<string, string>;
}

const initial: CessaoFormState = { error: null, fieldErrors: {} };

function getDados(formData: FormData) {
  return {
    numero_contrato: String(formData.get("numero_contrato") ?? ""),
    cliente_principal_id: String(formData.get("cliente_principal_id") ?? ""),
    cessionario_id: String(formData.get("cessionario_id") ?? ""),
    valor_total: String(formData.get("valor_total") ?? "0"),
    parcelas_total: String(formData.get("parcelas_total") ?? "1"),
    data_cessao: String(formData.get("data_cessao") ?? ""),
    data_vencimento_inicial: String(
      formData.get("data_vencimento_inicial") ?? "",
    ),
    taxa_juros: String(formData.get("taxa_juros") ?? "0"),
    observacoes: String(formData.get("observacoes") ?? ""),
  };
}

export async function criarCessao(
  _prev: CessaoFormState,
  formData: FormData,
): Promise<CessaoFormState> {
  const parsed = cessaoSchema.safeParse(getDados(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...initial, error: "Sessão expirada." };

  const { data: cessao, error } = await supabase
    .from("cessoes_credito")
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ...initial,
        fieldErrors: {
          numero_contrato: "Já existe cessão com esse número de contrato.",
        },
      };
    }
    return { ...initial, error: error.message };
  }

  revalidatePath("/dashboard/cessoes");
  redirect(`/dashboard/cessoes/${cessao.id}`);
}

export async function atualizarCessao(
  id: string,
  _prev: CessaoFormState,
  formData: FormData,
): Promise<CessaoFormState> {
  const parsed = cessaoSchema.safeParse(getDados(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);

  // Não atualiza valor_total/parcelas_total para não bagunçar parcelas geradas.
  const { numero_contrato, observacoes, taxa_juros } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("cessoes_credito")
    .update({ numero_contrato, observacoes, taxa_juros })
    .eq("id", id);

  if (error) return { ...initial, error: error.message };

  revalidatePath("/dashboard/cessoes");
  revalidatePath(`/dashboard/cessoes/${id}`);
  redirect(`/dashboard/cessoes/${id}`);
}

export async function cancelarCessao(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cessoes_credito")
    .update({ status: "cancelada" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/cessoes");
  revalidatePath(`/dashboard/cessoes/${id}`);
  return { error: null };
}

function toFieldErrors(
  err: import("zod").ZodError,
): CessaoFormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: null, fieldErrors };
}
