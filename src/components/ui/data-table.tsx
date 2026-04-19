interface DataTableProps {
  /** Cada item pode ser string simples ou ReactNode (ex.: SortableHeader). */
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  empty?: React.ReactNode;
}

export function DataTable({ headers, rows, empty }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-10 text-center">
        {empty ?? (
          <p className="text-sm text-[var(--muted)]">
            Nenhum registro encontrado.
          </p>
        )}
      </div>
    );
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
              className="border-t border-[var(--border)] hover:bg-black/20"
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
