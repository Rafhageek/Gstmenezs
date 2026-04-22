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

function toFieldErrors(err: import("zod").ZodError): ClienteFormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: null, fieldErrors };
}
