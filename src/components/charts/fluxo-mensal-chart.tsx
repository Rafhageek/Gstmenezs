"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FluxoMensal } from "@/types/database";
import { formatBRL } from "@/lib/format";

interface Props {
  data: FluxoMensal[];
}

const COLORS = {
  previsto: "#1e3a5f",
  realizado: "#c9a961",
  grid: "#1e3a5f",
  text: "#94a3b8",
};

export function FluxoMensalChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Fluxo mensal de recebíveis
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]/70">
          Previsto vs realizado nos últimos 6 meses + próximos 6 meses
        </p>
      </header>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.grid}
              vertical={false}
            />
            <XAxis
              dataKey="mes_label"
              stroke={COLORS.text}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              stroke={COLORS.text}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a1628",
                border: "1px solid #1e3a5f",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                formatBRL(Number(value)),
                String(name) === "previsto" ? "Previsto" : "Realizado",
              ]}
              cursor={{ fill: "rgba(201, 169, 97, 0.05)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: COLORS.text }}
              formatter={(value: string) =>
                value === "previsto" ? "Previsto" : "Realizado"
              }
            />
            <Bar
              dataKey="previsto"
              fill={COLORS.previsto}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="realizado"
              fill={COLORS.realizado}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
