"use client";

interface PrintButtonProps {
  label?: string;
  className?: string;
}

/**
 * Botão que chama window.print(). O CSS print global em globals.css
 * esconde header/footer/[data-no-print] e troca cores pra claras.
 */
export function PrintButton({
  label = "Imprimir / PDF",
  className,
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      data-no-print
      className={
        className ??
        "inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/40 bg-transparent px-4 py-2 text-xs font-semibold text-[var(--gold)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
      }
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
