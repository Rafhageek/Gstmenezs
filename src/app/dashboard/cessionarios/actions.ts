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

export async function excluirCessionario(id: string) {
  const supabase = await createClient();

  // Bloqueia se tiver cessões vinculadas
  const { count: cessoesCount } = await supabase
    .from("cessoes_credito")
    .select("id", { count: "exact", head: true })
    .eq("cessionario_id", id);

  if (cessoesCount && cessoesCount > 0) {
    return {
      error: `Não é possível excluir: este cessionário tem ${cessoesCount} cessão${cessoesCount === 1 ? "" : "ões"} vinculada${cessoesCount === 1 ? "" : "s"}. Exclua as cessões primeiro ou arquive o cadastro (Editar > desmarcar "Ativo").`,
    };
  }

  const { error } = await supabase
    .from("cessionarios")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/cessionarios");
  return { error: null };
}

export interface BulkResult {
  ok: number;
  falhas: { id: string; nome?: string; motivo: string }[];
}

export async function excluirCessionariosEmMassa(
  ids: string[],
): Promise<BulkResult> {
  const result: BulkResult = { ok: 0, falhas: [] };
  if (ids.length === 0) return result;

  const supabase = await createClient();

  const { data: nomesRes } = await supabase
    .from("cessionarios")
    .select("id, nome")
    .in("id", ids);
  const nomeMap = new Map(
    (nomesRes ?? []).map((c) => [c.id as string, c.nome as string]),
  );

  const { data: comCessoes } = await supabase
    .from("cessoes_credito")
    .select("cessionario_id")
    .in("cessionario_id", ids);
  const idsComCessoes = new Set(
    (comCessoes ?? []).map(
      (c) => (c as { cessionario_id: string }).cessionario_id,
    ),
  );

  const podeExcluir = ids.filter((id) => !idsComCessoes.has(id));
  for (const id of ids) {
    if (idsComCessoes.has(id)) {
      result.falhas.push({
        id,
        nome: nomeMap.get(id),
        motivo: "tem cessões vinculadas",
      });
    }
  }

  if (podeExcluir.length > 0) {
    const { error, count } = await supabase
      .from("cessionarios")
      .delete({ count: "exact" })
      .in("id", podeExcluir);
    if (error) {
      for (const id of podeExcluir) {
        result.falhas.push({
          id,
          nome: nomeMap.get(id),
          motivo: error.message,
        });
      }
    } else {
      result.ok = count ?? podeExcluir.length;
    }
  }

  revalidatePath("/dashboard/cessionarios");
  return result;
}

export async function ativarCessionariosEmMassa(
  ids: string[],
  ativo: boolean,
): Promise<BulkResult> {
  const result: BulkResult = { ok: 0, falhas: [] };
  if (ids.length === 0) return result;

  const supabase = await createClient();

  const { data: nomesRes } = await supabase
    .from("cessionarios")
    .select("id, nome")
    .in("id", ids);
  const nomeMap = new Map(
    (nomesRes ?? []).map((c) => [c.id as string, c.nome as string]),
  );

  // Um-a-um pra isolar falhas
  for (const id of ids) {
    const { error } = await supabase
      .from("cessionarios")
      .update({ ativo })
      .eq("id", id);
    if (error) {
      console.error(
        `[ativarCessionariosEmMassa] id=${id} erro:`,
        JSON.stringify(error, null, 2),
      );
      result.falhas.push({
        id,
        nome: nomeMap.get(id),
        motivo: traduzirErroCessionario(error),
      });
    } else {
      result.ok += 1;
    }
  }

  revalidatePath("/dashboard/cessionarios");
  return result;
}

function traduzirErroCessionario(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505") {
    return "conflito de CPF/CNPJ duplicado no banco (contate o suporte)";
  }
  if (error.code === "23503") {
    return "possui registros vinculados";
  }
  return error.message;
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
