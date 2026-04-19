"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { digits } from "@/lib/format";
import type { UserRole } from "@/types/database";

const enderecoSchema = z
  .object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().length(2).optional().or(z.literal("")),
  })
  .optional();

const configSchema = z.object({
  razao_social: z.string().trim().min(3),
  nome_fantasia: z.string().trim().optional().or(z.literal("")),
  cnpj: z
    .string()
    .trim()
    .transform((v) => digits(v))
    .refine((v) => v.length === 0 || v.length === 14, "CNPJ inválido")
    .optional()
    .or(z.literal("")),
  oab: z.string().trim().optional().or(z.literal("")),
  endereco: enderecoSchema,
  telefone: z.string().trim().optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  site: z.string().trim().optional().or(z.literal("")),
  legenda_pdf: z.string().trim().optional().or(z.literal("")),
  cor_primaria: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional()
    .or(z.literal("")),
});

export interface ConfigFormState {
  error: string | null;
  ok?: boolean;
}

export async function salvarConfiguracoes(
  _prev: ConfigFormState,
  formData: FormData,
): Promise<ConfigFormState> {
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

  const cep = String(formData.get("cep") ?? "").trim();
  const logradouro = String(formData.get("logradouro") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const complemento = String(formData.get("complemento") ?? "").trim();
  const bairro = String(formData.get("bairro") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim().toUpperCase();
  const endereco =
    cep || logradouro || cidade
      ? { cep, logradouro, numero, complemento, bairro, cidade, uf }
      : undefined;

  const parsed = configSchema.safeParse({
    razao_social: formData.get("razao_social"),
    nome_fantasia: formData.get("nome_fantasia"),
    cnpj: formData.get("cnpj"),
    oab: formData.get("oab"),
    endereco,
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    site: formData.get("site"),
    legenda_pdf: formData.get("legenda_pdf"),
    cor_primaria: formData.get("cor_primaria"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const dados = {
    ...parsed.data,
    nome_fantasia: parsed.data.nome_fantasia || null,
    cnpj: parsed.data.cnpj || null,
    oab: parsed.data.oab || null,
    telefone: parsed.data.telefone || null,
    email: parsed.data.email || null,
    site: parsed.data.site || null,
    legenda_pdf: parsed.data.legenda_pdf || null,
    cor_primaria: parsed.data.cor_primaria || null,
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("configuracoes")
    .update(dados)
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/configuracoes");
  return { error: null, ok: true };
}
