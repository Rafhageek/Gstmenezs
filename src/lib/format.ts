/**
 * Formatadores e helpers para o domínio Painel MNZ.
 * Sempre opera com locale pt-BR.
 */

/** Apenas dígitos. */
export function digits(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Formata um número como BRL (R$ 1.234,56). */
export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

/** Formata número sem símbolo (1.234,56). */
export function formatNumberBR(value: number | null | undefined): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Aplica máscara em CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
export function formatDocumento(value: string | null | undefined): string {
  const d = digits(value);
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (d.length === 14) {
    return d.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }
  return value ?? "";
}

/** Aplica máscara em telefone (00) 00000-0000 ou (00) 0000-0000. */
export function formatTelefone(value: string | null | undefined): string {
  const d = digits(value);
  if (d.length === 11) {
    return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (d.length === 10) {
    return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return value ?? "";
}

/** Formata data ISO (YYYY-MM-DD ou ISO timestamp) como DD/MM/YYYY. */
export function formatDataBR(value: string | null | undefined): string {
  if (!value) return "—";
  const onlyDate = value.length >= 10 ? value.slice(0, 10) : value;
  const [y, m, d] = onlyDate.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

/** Converte data brasileira (DD/MM/YYYY) para ISO (YYYY-MM-DD). */
export function parseDataBR(value: string): string | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

/** Validação CPF (algoritmo padrão da Receita). */
export function isCpfValido(cpf: string): boolean {
  const d = digits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(d[i]) * (t + 1 - i);
    const r = ((s * 10) % 11) % 10;
    if (r !== Number(d[t])) return false;
  }
  return true;
}

/** Validação CNPJ. */
export function isCnpjValido(cnpj: string): boolean {
  const d = digits(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * w[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Aceita CPF (11) OU CNPJ (14). */
export function isDocumentoValido(value: string): boolean {
  const d = digits(value);
  if (d.length === 11) return isCpfValido(d);
  if (d.length === 14) return isCnpjValido(d);
  return false;
}

/** Hoje no formato YYYY-MM-DD (timezone do servidor). */
export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}
