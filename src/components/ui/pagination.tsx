import Link from "next/link";

interface Props {
  total: number;
  pageSize: number;
  currentPage: number;
  /** Query string base (sem page). */
  baseQuery?: string;
}

export function Pagination({
  total,
  pageSize,
  currentPage,
  baseQuery = "",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const inicio = (currentPage - 1) * pageSize + 1;
  const fim = Math.min(currentPage * pageSize, total);

  const buildHref = (page: number) => {
    const sep = baseQuery && !baseQuery.endsWith("?") && !baseQuery.endsWith("&") ? "&" : "";
    return `?${baseQuery}${sep}page=${page}`;
  };

  return (
    <nav
      role="navigation"
      aria-label="Paginação"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]"
    >
      <span>
        Mostrando <strong className="text-foreground">{inicio}</strong>–
        <strong className="text-foreground">{fim}</strong> de{" "}
        <strong className="text-foreground">{total}</strong>
      </span>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--gold)] hover:text-foreground"
          >
            ← Anterior
          </Link>
        ) : (
          <span className="rounded-md border border-[var(--border)]/40 px-3 py-1.5 opacity-40">
            ← Anterior
          </span>
        )}
        <span>
          Página <strong className="text-foreground">{currentPage}</strong> /{" "}
          {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 hover:border-[var(--gold)] hover:text-foreground"
          >
            Próxima →
          </Link>
        ) : (
          <span className="rounded-md border border-[var(--border)]/40 px-3 py-1.5 opacity-40">
            Próxima →
          </span>
        )}
      </div>
    </nav>
  );
}
