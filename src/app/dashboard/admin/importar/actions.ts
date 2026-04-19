"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCSV, detectarDelimitador } from "@/lib/csv-parse";
import { digits } from "@/lib/format";
import type { UserRole } from "@/types/database";

export interface LinhaImport {
  linha: number;
  numero_contrato: string;
  cliente_nome: string;
  cliente_documento: string;
  cessionario_nome: string;
  cessionario_documento: string;
  valor_total: number;
  parcelas_total: number;
  data_cessao: string;
  data_vencimento_inicial: string;
  percentual_cedido: number | null;
  observacoes: string;
  erro?: string;
}

export interface ImportState {
  error: string | null;
  preview?: LinhaImport[];
  importado?: {
    sucesso: number;
    falhas: { linha: number; numero_contrato: string; erro: string }[];
  };
}

/** Formatos aceitos para data: DD/MM/YYYY ou YYYY-MM-DD. */
function parseData(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function parseValor(raw: string): number | null {
  if (!raw) return null;
  // Remove R$, espaços e converte vírgula decimal
  const clean = raw
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

function parseInt10(raw: string): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parsePercentual(raw: string): number | null {
  if (!raw) return null;
  const clean = raw.replace(/%/g, "").replace(",", ".").trim();
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

/** Analisa CSV e devolve preview (sem gravar). */
export async function analisarCSV(
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("arquivo") as File | null;
  if (!file || file.size === 0) {
    return { error: "Selecione um arquivo CSV." };
  }

  const text = await file.text();
  const delim = detectarDelimitador(text);
  const { headers, rows } = parseCSV(text, delim);

  if (rows.length === 0) {
    return { error: "CSV sem linhas de dados." };
  }

  const required = [
    "numero_contrato",
    "cliente_nome",
    "cliente_documento",
    "cessionario_nome",
    "cessionario_documento",
    "valor_total",
    "parcelas_total",
    "data_cessao",
    "data_vencimento_inicial",
  ];
  const missing = required.filter((c) => !headers.includes(c));
  if (missing.length) {
    return {
      error: `Colunas obrigatórias ausentes: ${missing.join(", ")}. Baixe o template para o formato correto.`,
    };
  }

  const preview: LinhaImport[] = rows.map((r, idx) => {
    const linhaDados: LinhaImport = {
      linha: idx + 2, // +2: linha 1 = header, linhas começam em 1
      numero_contrato: r.numero_contrato ?? "",
      cliente_nome: r.cliente_nome ?? "",
      cliente_documento: digits(r.cliente_documento ?? ""),
      cessionario_nome: r.cessionario_nome ?? "",
      cessionario_documento: digits(r.cessionario_documento ?? ""),
      valor_total: parseValor(r.valor_total ?? "") ?? 0,
      parcelas_total: parseInt10(r.parcelas_total ?? "") ?? 0,
      data_cessao: parseData(r.data_cessao ?? "") ?? "",
      data_vencimento_inicial:
        parseData(r.data_vencimento_inicial ?? "") ?? "",
      percentual_cedido: parsePercentual(r.percentual_cedido ?? ""),
      observacoes: r.observacoes ?? "",
    };

    // Validações
    const erros: string[] = [];
    if (!linhaDados.numero_contrato) erros.push("contrato vazio");
    if (!linhaDados.cliente_nome) erros.push("cliente vazio");
    if (
      linhaDados.cliente_documento.length !== 11 &&
      linhaDados.cliente_documento.length !== 14
    )
      erros.push("CPF/CNPJ cliente inválido");
    if (!linhaDados.cessionario_nome) erros.push("cessionário vazio");
    if (
      linhaDados.cessionario_documento.length !== 11 &&
      linhaDados.cessionario_documento.length !== 14
    )
      erros.push("CPF/CNPJ cessionário inválido");
    if (linhaDados.valor_total <= 0) erros.push("valor inválido");
    if (linhaDados.parcelas_total < 1) erros.push("parcelas inválidas");
    if (!linhaDados.data_cessao) erros.push("data cessão inválida");
    if (!linhaDados.data_vencimento_inicial)
      erros.push("1º vencimento inválido");

    if (erros.length) linhaDados.erro = erros.join("; ");
    return linhaDados;
  });

  return { error: null, preview };
}

/** Executa a importação. Cria clientes/cessionários se não existirem. */
export async function executarImportacao(
  linhas: LinhaImport[],
): Promise<ImportState> {
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
    return { error: "Apenas administradores podem importar em lote." };
  }

  const validas = linhas.filter((l) => !l.erro);
  const sucessos: number = 0;
  const falhas: { linha: number; numero_contrato: string; erro: string }[] = [];
  let contadorSucesso = sucessos;

  for (const l of validas) {
    try {
      // 1. Upsert cliente
      const { data: clienteExistente } = await supabase
        .from("clientes_principais")
        .select("id")
        .eq("documento", l.cliente_documento)
        .maybeSingle();

      let clienteId = clienteExistente?.id;
      if (!clienteId) {
        const { data: novoCliente, error: errC } = await supabase
          .from("clientes_principais")
          .insert({
            nome: l.cliente_nome,
            documento: l.cliente_documento,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (errC) throw new Error(`criar cliente: ${errC.message}`);
        clienteId = novoCliente.id;
      }

      // 2. Upsert cessionário
      const { data: cessionarioExistente } = await supabase
        .from("cessionarios")
        .select("id")
        .eq("documento", l.cessionario_documento)
        .maybeSingle();

      let cessionarioId = cessionarioExistente?.id;
      if (!cessionarioId) {
        const { data: novoCess, error: errCe } = await supabase
          .from("cessionarios")
          .insert({
            nome: l.cessionario_nome,
            documento: l.cessionario_documento,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (errCe) throw new Error(`criar cessionário: ${errCe.message}`);
        cessionarioId = novoCess.id;
      }

      // 3. Criar cessão (trigger gera parcelas automaticamente)
      const { error: errCs } = await supabase
        .from("cessoes_credito")
        .insert({
          numero_contrato: l.numero_contrato,
          cliente_principal_id: clienteId,
          cessionario_id: cessionarioId,
          valor_total: l.valor_total,
          parcelas_total: l.parcelas_total,
          data_cessao: l.data_cessao,
          data_vencimento_inicial: l.data_vencimento_inicial,
          percentual_cedido: l.percentual_cedido,
          observacoes: l.observacoes || null,
          created_by: user.id,
        });
      if (errCs) throw new Error(`criar cessão: ${errCs.message}`);

      contadorSucesso++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro desconhecido";
      falhas.push({
        linha: l.linha,
        numero_contrato: l.numero_contrato,
        erro: msg,
      });
    }
  }

  revalidatePath("/dashboard/cessoes");
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/cessionarios");
  revalidatePath("/dashboard");

  return {
    error: null,
    importado: { sucesso: contadorSucesso, falhas },
  };
}
