/**
 * Parser CSV simples e robusto para importação.
 * - Suporta delimitador `;` (padrão BR) ou `,`
 * - Suporta aspas para escape
 * - Remove BOM UTF-8
 */

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCSV(
  input: string,
  delimiter: "," | ";" = ";",
): ParseResult {
  const clean = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === delimiter) {
        current.push(field);
        field = "";
      } else if (c === "\n") {
        current.push(field);
        if (current.some((f) => f !== "")) lines.push(current);
        current = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || current.length > 0) {
    current.push(field);
    if (current.some((f) => f !== "")) lines.push(current);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (lines[i][j] ?? "").trim();
    }
    rows.push(obj);
  }

  return { headers, rows };
}

/** Detecta qual delimitador o CSV usa (auto). */
export function detectarDelimitador(input: string): "," | ";" {
  const firstLine = input.split(/\r?\n/)[0] ?? "";
  const comma = (firstLine.match(/,/g) ?? []).length;
  const semi = (firstLine.match(/;/g) ?? []).length;
  return semi >= comma ? ";" : ",";
}
