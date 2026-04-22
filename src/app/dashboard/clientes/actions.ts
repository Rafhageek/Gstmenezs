"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/validations/cliente";

export interface ClienteFormState {
  error: string | null;
  fieldErrors: Record<string, string>;
}

const initial: ClienteFormState = { error: null, fieldErrors: {} };

function parseEndereco(formData: FormData) {
  const cep = String(formData.get("cep") ?? "").trim();
  const logradouro = String(formData.get("logradouro") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const complemento = String(formData.get("complemento") ?? "").trim();
  const bairro = String(formData.get("bairro") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim().toUpperCase();
  if (!cep && !logradouro && !cidade) return undefined;
  return { cep, logradouro, numero, complemento, bairro, cidade, uf };
}

function getDados(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? ""),
    documento: String(formData.get("documento") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    endereco: parseEndereco(formData),
    observacoes: String(formData.get("observacoes") ?? ""),
    ativo: formData.get("ativo") === "on" || formData.get("ativo") === "true",
  };
}

export async function criarCliente(
  _prev: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  const parsed = clienteSchema.safeParse(getDados(formData));
  if (!parsed.success) {
    return toFieldErrors(parsed.error);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...initial, error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("clientes_principais").insert({
    ...parsed.data,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ...initial,
        fieldErrors: { documento: "Já existe cliente com esse CPF/CNPJ." },
      };
    }
    return { ...initial, error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  redirect("/dashboard/clientes");
}

export async function atualizarCliente(
  id: string,
  _prev: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  const parsed = clienteSchema.safeParse(getDados(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes_principais")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ...initial, error: error.message };

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${id}`);
  redirect("/dashboard/clientes");
}

export async function excluirCliente(id: string) {
  const supabase = await createClient();

  // Bloqueia se tiver cessões vinculadas (preserva integridade contábil)
  const { count: cessoesCount } = await supabase
    .from("cessoes_credito")
    .select("id", { count: "exact", head: true })
    .eq("cliente_principal_id", id);

  if (cessoesCount && cessoesCount > 0) {
    return {
      error: `Não é possível excluir: este cliente tem ${cessoesCount} cessão${cessoesCount === 1 ? "" : "ões"} vinculada${cessoesCount === 1 ? "" : "s"}. Exclua as cessões primeiro ou arquive o cadastro (Editar > desmarcar "Ativo").`,
    };
  }

  const { error } = await supabase
    .from("clientes_principais")
    .delete()
    .eq("id", id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/dashboard/clientes");
  return { error: null };
}

export interface BulkResult {
  ok: number;
  falhas: { id: string; nome?: string; motivo: string }[];
}

/**
 * Exclui múltiplos clientes. Pula (não falha) os que têm cessões vinculadas,
 * retornando-os na lista de falhas com motivo claro.
 */
export async function excluirClientesEmMassa(ids: string[]): Promise<BulkResult> {
  const result: BulkResult = { ok: 0, falhas: [] };
  if (ids.length === 0) return result;

  const supabase = await createClient();

  // Busca nomes pra mensagens amigáveis
  const { data: nomesRes } = await supabase
    .from("clientes_principais")
    .select("id, nome")
    .in("id", ids);
  const nomeMap = new Map(
    (nomesRes ?? []).map((c) => [c.id as string, c.nome as string]),
  );

  // Busca quais têm cessões vinculadas (em 1 query)
  const { data: comCessoes } = await supabase
    .from("cessoes_credito")
    .select("cliente_principal_id")
    .in("cliente_principal_id", ids);
  const idsComCessoes = new Set(
    (comCessoes ?? []).map(
      (c) => (c as { cliente_principal_id: string }).cliente_principal_id,
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
      .from("clientes_principais")
      .delete({ count: "exact" })
      .in("id", podeExcluir);
    if (error) {
      for (const id of podeExcluir) {
        result.falhas.push({ id, nome: nomeMap.get(id), motivo: error.message });
      }
    } else {
      result.ok = count ?? podeExcluir.length;
    }
  }

  revalidatePath("/dashboard/clientes");
  return result;
}

export async function ativarClientesEmMassa(
  ids: string[],
  ativo: boolean,
): Promise<BulkResult> {
  const result: BulkResult = { ok: 0, falhas: [] };
  if (ids.length === 0) return result;

  const supabase = await createClient();

  // Busca nomes pra mensagens amigáveis
  const { data: nomesRes } = await supabase
    .from("clientes_principais")
    .select("id, nome")
    .in("id", ids);
  const nomeMap = new Map(
    (nomesRes ?? []).map((c) => [c.id as string, c.nome as string]),
  );

  // Atualiza um-a-um pra isolar falhas (se um violar constraint,
  // não derruba o lote inteiro)
  for (const id of ids) {
    const { error } = await supabase
      .from("clientes_principais")
      .update({ ativo })
      .eq("id", id);
    if (error) {
      console.error(
        `[ativarClientesEmMassa] id=${id} erro:`,
        JSON.stringify(error, null, 2),
      );
      result.falhas.push({
        id,
        nome: nomeMap.get(id),
        motivo: traduzirErro(error),
      });
    } else {
      result.ok += 1;
    }
  }

  revalidatePath("/dashboard/clientes");
  return result;
}

function traduzirErro(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "conflito de CPF/CNPJ duplicado no banco (contate o suporte)";
  }
  if (error.code === "23503") {
    return "possui registros vinculados";
  }
  return error.message;
}

function toFieldErrors(err: import("zod").ZodError): ClienteFormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: null, fieldErrors };
}
