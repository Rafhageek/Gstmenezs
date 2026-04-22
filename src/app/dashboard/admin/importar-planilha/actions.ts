"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CessionarioHistorico } from "@/lib/planilha-historico-parser";

export interface ImportResult {
  cessionariosCriados: number;
  cessoesCriadas: number;
  pagamentosCriados: number;
  falhas: { cessionario: string; motivo: string }[];
}

/**
 * Importa tudo de verdade no banco. Vincula todas as cessões ao `clienteId`.
 *
 * Fluxo por cessionário:
 * 1. Cria cessionário (doc placeholder "PENDENTE-NNN" se não informado)
 * 2. Cria cessão (parcelas_total = N_pagamentos, valor = max(saldoInicial, soma pagos))
 * 3. Trigger gera N parcelas em branco
 * 4. Apaga as parcelas geradas e insere as corretas (1 por pagamento do histórico)
 */
export async function importarPlanilhaHistorico(
  clienteId: string,
  cessionarios: CessionarioHistorico[],
): Promise<ImportResult> {
  const result: ImportResult = {
    cessionariosCriados: 0,
    cessoesCriadas: 0,
    pagamentosCriados: 0,
    falhas: [],
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ...result,
      falhas: [{ cessionario: "sessão", motivo: "Não autenticado" }],
    };
  }

  // Valida cliente
  const { data: cliente } = await supabase
    .from("clientes_principais")
    .select("id, nome")
    .eq("id", clienteId)
    .maybeSingle<{ id: string; nome: string }>();
  if (!cliente) {
    return {
      ...result,
      falhas: [{ cessionario: "cliente", motivo: "Cliente não encontrado" }],
    };
  }

  // Gera prefixo para numero_contrato
  const ts = new Date()
    .toISOString()
    .slice(0, 16)
    .replace(/[-T:]/g, "");
  let placeholderSeq = 1;

  for (let idx = 0; idx < cessionarios.length; idx++) {
    const c = cessionarios[idx];
    try {
      await importarUmCessionario(supabase, {
        cliente,
        cessionario: c,
        userId: user.id,
        numeroContrato: `IMP-${ts}-${String(idx + 1).padStart(3, "0")}`,
        documentoPlaceholder: `PENDENTE-${String(placeholderSeq).padStart(3, "0")}`,
      });
      placeholderSeq++;
      result.cessionariosCriados += 1;
      result.cessoesCriadas += 1;
      result.pagamentosCriados += c.pagamentos.length;
    } catch (e) {
      const motivo = e instanceof Error ? e.message : String(e);
      result.falhas.push({ cessionario: c.nome, motivo });
    }
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${clienteId}`);
  revalidatePath("/dashboard/cessionarios");
  revalidatePath("/dashboard");

  return result;
}

interface ImportarUmArgs {
  cliente: { id: string; nome: string };
  cessionario: CessionarioHistorico;
  userId: string;
  numeroContrato: string;
  documentoPlaceholder: string;
}

async function importarUmCessionario(
  supabase: SupabaseClient,
  args: ImportarUmArgs,
): Promise<void> {
  const { cliente, cessionario, userId, numeroContrato, documentoPlaceholder } =
    args;

  // 1) Busca cessionário existente com mesmo nome (case-insensitive)
  let cessionarioId: string;
  const { data: existente } = await supabase
    .from("cessionarios")
    .select("id")
    .ilike("nome", cessionario.nome)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existente?.id) {
    cessionarioId = existente.id;
  } else {
    const somaPagos = cessionario.pagamentos.reduce((s, p) => s + p.valor, 0);
    const valorCessao = Math.max(cessionario.saldoInicial, somaPagos);
    const primeiroPagamento = cessionario.pagamentos[0]?.data ?? null;

    const { data: novo, error: errNovo } = await supabase
      .from("cessionarios")
      .insert({
        nome: cessionario.nome,
        documento: documentoPlaceholder,
        tipo_pessoa: "PJ",
        ativo: true,
        observacoes: "[IMPORT] CPF/CNPJ pendente — atualizar ao editar",
        valor_cessao: valorCessao,
        valor_contratado: cessionario.saldoInicial || valorCessao,
        percentual: cessionario.percentualCedido,
        data_contrato: primeiroPagamento,
        created_by: userId,
      })
      .select("id")
      .single<{ id: string }>();
    if (errNovo || !novo) {
      throw new Error(`cessionário: ${errNovo?.message ?? "sem id"}`);
    }
    cessionarioId = novo.id;
  }

  // 2) Cria cessão (trigger vai gerar parcelas em branco — vamos deletar depois)
  const somaPagos = cessionario.pagamentos.reduce((s, p) => s + p.valor, 0);
  const valorTotal = Math.max(cessionario.saldoInicial, somaPagos, 0.01);
  const primeiraData = cessionario.pagamentos[0]?.data ?? new Date().toISOString().slice(0, 10);
  const ultimaData =
    cessionario.pagamentos[cessionario.pagamentos.length - 1]?.data ?? primeiraData;

  const { data: cessao, error: errCessao } = await supabase
    .from("cessoes_credito")
    .insert({
      numero_contrato: numeroContrato,
      cliente_principal_id: cliente.id,
      cessionario_id: cessionarioId,
      valor_total: valorTotal,
      parcelas_total: cessionario.pagamentos.length || 1,
      data_cessao: primeiraData,
      data_vencimento_inicial: primeiraData,
      status: "ativa",
      percentual_cedido: cessionario.percentualCedido,
      observacoes: `[IMPORT] Origem: ${cessionario.arquivo}. Saldo inicial original: R$ ${cessionario.saldoInicial.toFixed(2)}. Último pagamento: ${ultimaData}.`,
      created_by: userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (errCessao || !cessao) {
    throw new Error(`cessão: ${errCessao?.message ?? "sem id"}`);
  }

  // 3) Apaga as parcelas geradas pelo trigger (estão em branco, datas auto)
  await supabase.from("pagamentos").delete().eq("cessao_id", cessao.id);

  // 4) Insere 1 parcela "paga" por pagamento do histórico
  const inserts = cessionario.pagamentos.map((p, i) => ({
    cessao_id: cessao.id,
    numero_parcela: i + 1,
    valor: p.valor,
    valor_original: p.valor,
    data_vencimento: p.data,
    data_pagamento: p.data,
    tipo: "parcela" as const,
    observacoes: p.observacao ?? null,
    is_reversal: false,
    reversal_of: null,
    created_by: userId,
  }));

  if (inserts.length > 0) {
    const { error: errIns } = await supabase.from("pagamentos").insert(inserts);
    if (errIns) throw new Error(`pagamentos: ${errIns.message}`);
  }
}
