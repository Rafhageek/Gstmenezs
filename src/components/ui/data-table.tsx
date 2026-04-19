import { EmptyState } from "./empty-state";

interface DataTableProps {
  /** Cada item pode ser string simples ou ReactNode (ex.: SortableHeader). */
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  /** Conteúdo do estado vazio (override). Se omitido, usa EmptyState genérico. */
  empty?: React.ReactNode;
  /** Tipo do empty state (para fallback automático). */
  emptyTipo?: Parameters<typeof EmptyState>[0]["tipo"];
}

export function DataTable({
  headers,
  rows,
  empty,
  emptyTipo = "generic",
}: DataTableProps) {
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
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-t border-[var(--border)] transition-colors ${
                i % 2 === 1 ? "bg-black/[0.08]" : ""
              } hover:bg-[var(--gold)]/[0.06]`}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
