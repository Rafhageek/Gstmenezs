/**
 * Skeleton reutilizável com efeito shimmer dourado sutil.
 * Use para placeholders de texto, cards e tabelas enquanto dados carregam.
 */

interface SkeletonProps {
  className?: string;
  /** Se true, aplica um efeito shimmer (recomendado só em pouco elementos para não poluir). */
  shimmer?: boolean;
}

export function Skeleton({ className = "", shimmer = true }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-md bg-[var(--border)]/40 ${
        shimmer ? "skeleton-shimmer" : "animate-pulse"
      } ${className}`}
    />
  );
}

/** Skeleton para uma linha de texto. Use className para definir largura/altura. */
export function SkeletonText({ className = "" }: { className?: string }) {
  return (
    <Skeleton
      className={`h-4 ${className}`}
      shimmer={false}
    />
  );
}

/** Skeleton de um KPI card (usar no dashboard). */
export function SkeletonKpi() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <Skeleton className="h-3 w-24" shimmer={false} />
      <Skeleton className="mt-3 h-8 w-40" />
    </div>
  );
}

/** Skeleton de linha de tabela (N colunas). */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-t border-[var(--border)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" shimmer={false} />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton completo de uma tabela (header + N linhas). */
export function SkeletonTable({
  cols = 5,
  rows = 8,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
      <table className="w-full text-sm">
        <thead className="bg-black/30">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-20" shimmer={false} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
