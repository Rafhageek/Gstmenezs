"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface Props {
  /** Porcentagem recebida (0-100). */
  pctRecebido: number;
  /** Cor da fatia "recebido". Default: verde. */
  colorRecebido?: string;
  /** Cor da fatia "a receber". Default: dourado. */
  colorAReceber?: string;
  /** Titulo acima do donut. */
  titulo?: string;
  /** Legenda embaixo do numero central. */
  legenda?: string;
}

/**
 * Donut minimalista mostrando apenas a porcentagem recebida
 * em destaque no centro. Sem legenda lateral.
 */
export function DonutPct({
  pctRecebido,
  colorRecebido = "#10b981",
  colorAReceber = "#c9a961",
  titulo = "Progresso",
  legenda = "recebido",
}: Props) {
  const pctAReceber = Math.max(0, 100 - pctRecebido);
  const data = [
    { name: "Recebido", value: pctRecebido },
    { name: "A receber", value: pctAReceber },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          {titulo}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]/70">
          % do total pago
        </p>
      </header>

      <div className="relative flex flex-1 items-center justify-center">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="#0a1628"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                <Cell fill={colorRecebido} />
                <Cell fill={colorAReceber} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-foreground">
            {pctRecebido.toFixed(1)}%
          </span>
          <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {legenda}
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: colorRecebido }}
          />
          <span className="text-[var(--muted)]">Recebido</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: colorAReceber }}
          />
          <span className="text-[var(--muted)]">A receber</span>
        </span>
      </div>
    </div>
  );
}
