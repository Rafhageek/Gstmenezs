"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatBRL } from "@/lib/format";

interface PizzaData {
  name: string;
  value: number;
}

interface Props {
  titulo?: string;
  subtitulo?: string;
  data: PizzaData[];
  /** Cores em ordem de prioridade. */
  colors?: string[];
  /** Texto grande no centro do donut (ex: "33%"). */
  centerLabel?: string;
  /** Texto pequeno abaixo do centerLabel (ex: "recebido"). */
  centerSub?: string;
}

const DEFAULT_COLORS = [
  "#c9a961", // dourado
  "#1e3a5f", // azul marinho
  "#10b981", // verde
  "#94a3b8", // cinza
  "#ef4444", // vermelho
  "#f59e0b", // âmbar
];

export function CessoesPizzaChart({
  titulo,
  subtitulo,
  data,
  colors = DEFAULT_COLORS,
  centerLabel,
  centerSub,
}: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      {(titulo || subtitulo) && (
        <header className="mb-4">
          {titulo && (
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              {titulo}
            </h3>
          )}
          {subtitulo && (
            <p className="mt-1 text-xs text-[var(--muted)]/70">{subtitulo}</p>
          )}
        </header>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative h-56 w-full">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
              Sem dados
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#0a1628"
                    strokeWidth={2}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a1628",
                      border: "1px solid #1e3a5f",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => formatBRL(Number(v))}
                  />
                </PieChart>
              </ResponsiveContainer>

              {centerLabel && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-foreground">
                    {centerLabel}
                  </span>
                  {centerSub && (
                    <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                      {centerSub}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <ul className="space-y-2 text-xs">
          {data.map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <li
                key={d.name}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                  <span className="text-foreground">{d.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono">{formatBRL(d.value)}</div>
                  <div className="text-[var(--muted)]">{pct.toFixed(1)}%</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
