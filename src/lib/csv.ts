/**
 * Utilitário para gerar CSV com escape correto.
 * Usa BOM UTF-8 para o Excel reconhecer acentuação.
 */

type Cell = string | number | boolean | null | undefined;

export function toCSV(headers: string[], rows: Cell[][]): string {
  const lines = [headers.map(escapeCell).join(";")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(";"));
  }
  return "\uFEFF" + lines.join("\r\n");
}

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[";\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Retorna a data atual no formato YYYY-MM-DD para nome de arquivo. */
export function nomeArquivoData(prefixo: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `${prefixo}-${hoje}.csv`;
}
