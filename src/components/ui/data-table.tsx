"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "./empty-state";

interface DataTableProps {
  /** Cada item pode ser string simples ou ReactNode (ex.: SortableHeader). */
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  /** Conteúdo do estado vazio (override). Se omitido, usa EmptyState genérico. */
  empty?: React.ReactNode;
  /** Tipo do empty state (para fallback automático). */
  emptyTipo?: Parameters<typeof EmptyState>[0]["tipo"];
  /**
   * Torna cada linha clicável. Recebe o índice da linha e retorna o href.
   * Links/botões internos continuam funcionando normalmente (não propagam).
   */
  rowHref?: (rowIndex: number) => string | null | undefined;
}

export function DataTable({
  headers,
  rows,
  empty,
  emptyTipo = "generic",
  rowHref,
}: DataTableProps) {
  const router = useRouter();

  if (rows.length === 0) {
    if (empty) {
      return (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-10 text-center">
          {empty}
        </div>
      );
    }
    return <EmptyState tipo={emptyTipo} />;
  }

  function handleRowClick(e: React.MouseEvent<HTMLTableRowElement>, href: string) {
    const target = e.target as HTMLElement;
    // Ignora clique em links, botões, inputs etc — deixa o elemento nativo agir
    if (target.closest("a, button, input, select, textarea, label")) return;
    router.push(href);
  }

  function handleRowKey(e: React.KeyboardEvent<HTMLTableRowElement>, href: string) {
    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, input, select, textarea")) return;
      e.preventDefault();
      router.push(href);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
      <table className="w-full text-sm">
        <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const href = rowHref?.(i) ?? null;
            const isClickable = Boolean(href);
            return (
              <tr
                key={i}
                onClick={
                  isClickable
                    ? (e) => handleRowClick(e, href as string)
                    : undefined
                }
                onKeyDown={
                  isClickable
                    ? (e) => handleRowKey(e, href as string)
                    : undefined
                }
                tabIndex={isClickable ? 0 : undefined}
                role={isClickable ? "link" : undefined}
                className={`border-t border-[var(--border)] transition-colors ${
                  i % 2 === 1 ? "bg-black/[0.08]" : ""
                } hover:bg-[var(--gold)]/[0.06] ${
                  isClickable
                    ? "cursor-pointer focus:bg-[var(--gold)]/[0.08] focus:outline-none"
                    : ""
                }`}
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
