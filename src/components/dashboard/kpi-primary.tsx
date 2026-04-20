"use client";

import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  label: string;
  value: number;
  /** Variação % vs mês anterior, opcional (ex.: 12.5). */
  variacao?: number | null;
  /** Valor secundário para contexto (ex.: "de R$ 500.000 total"). */
  sub?: string;
  icon?: React.ReactNode;
}

/**
 * Card KPI principal — destaque visual com borda dourada,
 * valor em tamanho grande com contagem animada, gradient sutil.
 */
export function KpiPrimary({ label, value, variacao, sub, icon }: Props) {
  const positivo = variacao === null || variacao === undefined || variacao >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl border-2 border-[var(--gold)]/50 bg-[var(--background-elevated)] p-6 shadow-xl shadow-[var(--gold)]/5"
      style={{
        backgroundImage:
          "radial-gradient(600px circle at 100% 0%, rgba(201,169,97,0.08), transparent 50%)",
      }}
    >
      {/* Barra de destaque superior */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            <AnimatedCounter
              value={value}
              format="brl"
              className="font-mono"
            />
          </p>
          {sub && (
            <p className="mt-2 text-xs text-[var(--muted)]">{sub}</p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
            aria-hidden
          >
            {icon}
          </div>
        )}
      </div>

      {variacao !== undefined && variacao !== null && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
              positivo
                ? "bg-[var(--success)]/15 text-[var(--success)]"
                : "bg-[var(--danger)]/15 text-[var(--danger)]"
            }`}
          >
            <span aria-hidden className="text-sm">
              {positivo ? "↑" : "↓"}
            </span>
            {Math.abs(variacao).toFixed(1)}%
          </span>
          <span className="text-[11px] text-[var(--muted)]">
            vs mês anterior
          </span>
        </div>
      )}
    </div>
  );
}
