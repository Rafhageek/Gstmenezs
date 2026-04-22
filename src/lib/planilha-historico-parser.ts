/**
 * Parser para os HTMLs exportados da planilha do contador Gabriel Guimarães.
 *
 * Cada arquivo representa 1 cessionário. A planilha tem um formato fixo
 * com células em sequência: % a receber, nome, % cedida, saldo inicial,
 * e histórico de pagamentos (data + valor + saldo).
 */

export interface PagamentoHistorico {
  data: string; // ISO YYYY-MM-DD
  valor: number;
  saldoApos: number | null;
  observacao?: string;
}

export interface CessionarioHistorico {
  arquivo: string;
  nome: string;
  percentualCedido: number | null; // 0.02 significa 0,02%
  saldoInicial: number; // valor total da cessão no contrato original
  pagamentos: PagamentoHistorico[];
  totalRecebido: number;
  saldoDevedor: number; // pode ser negativo se pagou mais que o previsto
}

export interface ParseResult {
  cessionario: CessionarioHistorico | null;
  avisos: string[];
}

/** Extrai sequência de textos de todas as <td> no HTML (já sem tags). */
function extrairCelulas(html: string): string[] {
  const matches = html.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) ?? [];
  return matches.map((raw) =>
    raw
      .replace(/<[^>]+>/g, "") // remove tags internas (<span>, <br>, etc.)
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** Parse "R$ 29.390,00" ou "- R$ 5.000,00" → number. */
function parseValorBRL(raw: string): number | null {
  if (!raw) return null;
  // Datas (10/24/2025) viram 10242025 sem essa guarda — bug que inflava
  // saldo inicial em 4 abas (HM, MB PART, DATEC, SL-PRO LIFE).
  if (raw.includes("/")) return null;
  const s = raw.replace(/R\$/g, "").replace(/\s/g, "").trim();
  if (!s || s === "-") return null;
  // Tem que ter dígito e formato monetário (sem caracteres estranhos).
  if (!/[\d]/.test(s)) return null;
  if (!/^[-(]?[\d.,]+\)?$/.test(s)) return null;
  const negativo = s.startsWith("-") || s.includes("(");
  const limpo = s.replace(/[^\d,.-]/g, "").replace(/^-/, "");
  const parts = limpo.split(",");
  if (parts.length > 2) return null;
  const inteiro = parts[0].replace(/\./g, "");
  const decimal = parts[1] ?? "00";
  const n = Number(`${inteiro}.${decimal.slice(0, 2).padEnd(2, "0")}`);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

/**
 * Parse formatos de data aceitos pela planilha:
 * - "10/24/2025" (M/D/YYYY americano)
 * - "24/10/2025" (D/M/YYYY brasileiro)
 * - "31/05/23" (D/M/YY)
 *
 * Heurística: se ano tem 2 dígitos → 20XX. Se o primeiro número > 12,
 * é dia (BR). Se o segundo > 12, é mês (US). Senão, assume BR (padrão
 * brasileiro nesta planilha específica).
 */
function parseData(raw: string): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const n1 = Number(m[1]);
  const n2 = Number(m[2]);
  let yyyy = m[3];
  if (yyyy.length === 2) yyyy = `20${yyyy}`;

  let dd: number;
  let mm: number;
  if (n1 > 12) {
    dd = n1;
    mm = n2;
  } else if (n2 > 12) {
    // US: M/D/Y
    mm = n1;
    dd = n2;
  } else {
    // Ambíguo — assume BR (D/M/Y) que é o padrão da planilha
    dd = n1;
    mm = n2;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  // Valida que a data é real no calendário (descarta 30/02, 31/04, etc.).
  // O contador às vezes digita data inválida na planilha (ex: JUMP 2026-02-30)
  // e o Postgres rejeita o INSERT inteiro de pagamentos da cessão.
  const yyyyN = Number(yyyy);
  const d = new Date(yyyyN, mm - 1, dd);
  if (
    d.getFullYear() !== yyyyN ||
    d.getMonth() + 1 !== mm ||
    d.getDate() !== dd
  ) {
    return null;
  }
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** Parse "0,020%" ou "0,15%" → 0.02 / 0.15 (em % unidades). */
function parsePercentual(raw: string): number | null {
  const m = raw.match(/([\d,]+)\s*%/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function parsePlanilhaHistorico(
  html: string,
  nomeArquivo: string,
): ParseResult {
  const avisos: string[] = [];
  const celulas = extrairCelulas(html);

  if (celulas.length < 10) {
    return { cessionario: null, avisos: ["Arquivo muito curto, provavelmente não é uma aba de cessionário."] };
  }

  // 1) Encontra % cedida: procura padrão "Cessão X,XXX%" ou "Cessão X%"
  let percentualCedido: number | null = null;
  for (const c of celulas) {
    if (/cess[ãa]o/i.test(c) && /%/.test(c)) {
      percentualCedido = parsePercentual(c);
      break;
    }
  }
  if (percentualCedido == null) {
    avisos.push("% cedida não encontrada, usando null.");
  }

  // 2) Nome do cessionário: heurística — primeira célula não-vazia antes de
  //    "Total Recebido" (ignora células de padding que o export HTML gera)
  let nome = "";
  const idxTotalRecebido = celulas.findIndex((c) => /^total\s+recebido$/i.test(c));
  if (idxTotalRecebido > 0) {
    for (let k = idxTotalRecebido - 1; k >= Math.max(0, idxTotalRecebido - 6); k--) {
      const candidato = celulas[k].trim();
      if (!candidato) continue;
      // Ignora células de erro do Excel (#ERRO!, #DIV/0!, #REF!, #VALUE!, #NAME?)
      // que apareciam como "nome" do cessionário (ex: Pinguim virava "#ERRO!").
      if (/^#(ERRO|DIV\/0|REF|VALUE|NAME|N\/A|NULL)/i.test(candidato)) {
        continue;
      }
      // Ignora rótulos comuns que podem aparecer antes
      if (
        /^(%\s*a?\s*receber|\d+\s*%|total|saldo|cess[ãa]o|recebimentos?|obs\.?|data)$/i.test(
          candidato,
        )
      ) {
        continue;
      }
      // Remove % colado (caso "NOME 0,010%")
      nome = candidato.replace(/\s+0?,?\d+\s*%/g, "").trim();
      if (nome) break;
    }
  }
  if (!nome) {
    // fallback: usa o nome do arquivo
    nome = nomeArquivo.replace(/\.html?$/i, "").trim();
    avisos.push("Nome do cessionário inferido do nome do arquivo.");
  }

  // 3) Total recebido e saldo a receber: os 2 primeiros valores BRL após
  //    a primeira "Total Recebido" (antes do HISTORICOS).
  let totalRecebido = 0;
  let saldoDevedor = 0;
  const idxHistoricos = celulas.findIndex((c) => /historicos?/i.test(c));
  if (idxTotalRecebido >= 0 && idxHistoricos > idxTotalRecebido) {
    const valoresEntre: number[] = [];
    for (let i = idxTotalRecebido; i < idxHistoricos; i++) {
      const v = parseValorBRL(celulas[i]);
      if (v != null) valoresEntre.push(v);
    }
    // Típico: [total_recebido, saldo_a_receber]
    if (valoresEntre.length >= 1) totalRecebido = valoresEntre[0];
    if (valoresEntre.length >= 2) saldoDevedor = valoresEntre[1];
  }

  // 4) Saldo inicial = valor original da cessão. A planilha do contador NÃO
  //    tem um campo confiável pra isso — o label "SALDO TOTAL INICIAL" é
  //    seguido pela DATA do primeiro pagamento (não pelo valor inicial), o
  //    que fazia o parser interpretar a data como número monstruoso.
  //
  //    A regra correta é: valor inicial = total já pago + saldo ainda a
  //    receber. Bate com o "Total" do Resumo Geral do contador.
  //
  //    Se saldo a receber for negativo (overpay — cessionário pagou mais do
  //    que devia), considera só o que foi recebido como valor inicial.
  let saldoInicial = totalRecebido + Math.max(0, saldoDevedor);
  if (saldoInicial === 0) {
    avisos.push("Saldo inicial não encontrado (cessão talvez sem valor original definido).");
  }

  // 5) Lista de pagamentos: após o cabeçalho "DATA RECEBIMENTOS SALDO OBS",
  //    procura trios [data M/D/YYYY, valor BRL, saldo BRL, opcional obs]
  const pagamentos: PagamentoHistorico[] = [];
  for (let i = idxHistoricos > 0 ? idxHistoricos : 0; i < celulas.length; i++) {
    const c = celulas[i];
    const iso = parseData(c);
    if (!iso) continue;
    // Próxima célula com valor BRL válido (pula vazios)
    let valor: number | null = null;
    let saldoApos: number | null = null;
    let obs: string | undefined = undefined;
    for (let j = i + 1; j < Math.min(i + 6, celulas.length); j++) {
      const v = parseValorBRL(celulas[j]);
      if (v != null && valor == null) {
        valor = v;
        continue;
      }
      if (v != null && saldoApos == null) {
        saldoApos = v;
        // proxima celula pode ser obs
        const proxima = celulas[j + 1] ?? "";
        if (proxima && !parseData(proxima) && parseValorBRL(proxima) == null) {
          obs = proxima;
        }
        break;
      }
    }
    if (valor != null) {
      pagamentos.push({
        data: iso,
        valor,
        saldoApos,
        observacao: obs,
      });
    }
  }

  // Em algumas abas (DATEC, MB PART, SL-PRO LIFE, Queiroz II) o contador
  // colocou o SALDO INICIAL na coluna RECEBIMENTOS da primeira linha do
  // histórico, fazendo o parser interpretá-lo como pagamento e dobrar o
  // valor recebido. Detecta isso: se o primeiro "pagamento" tem valor
  // exatamente igual ao saldo inicial esperado, é lançamento de abertura
  // — descarta.
  if (
    pagamentos.length > 0 &&
    saldoInicial > 0 &&
    Math.abs(pagamentos[0].valor - saldoInicial) < 0.5
  ) {
    pagamentos.shift();
    avisos.push(
      "Primeira linha do histórico era saldo inicial duplicado — descartada.",
    );
  }

  if (pagamentos.length === 0) {
    avisos.push("Nenhum pagamento encontrado no histórico.");
  }

  // Se não encontrou totalRecebido, calcula da soma dos pagamentos
  if (totalRecebido === 0 && pagamentos.length > 0) {
    totalRecebido = pagamentos.reduce((s, p) => s + p.valor, 0);
  }

  return {
    cessionario: {
      arquivo: nomeArquivo,
      nome,
      percentualCedido,
      saldoInicial,
      pagamentos,
      totalRecebido,
      saldoDevedor,
    },
    avisos,
  };
}
