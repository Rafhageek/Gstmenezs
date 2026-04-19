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
  Cell,
} from "recharts";
import type { FluxoMensal } from "@/types/database";
import { formatBRL } from "@/lib/format";

interface Props {
  data: FluxoMensal[];
}

const COLORS = {
  grid: "#1e3a5f",
  text: "#94a3b8",
};

export function FluxoMensalChart({ data }: Props) {
  const hojeMes = new Date().toISOString().slice(0, 7);

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
            <defs>
              <linearGradient id="gradPrevisto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a5f" stopOpacity={1} />
                <stop offset="100%" stopColor="#1e3a5f" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="gradRealizado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4b876" stopOpacity={1} />
                <stop offset="100%" stopColor="#c9a961" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradRealizadoMesAtual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5d87a" stopOpacity={1} />
                <stop offset="100%" stopColor="#d4b876" stopOpacity={0.85} />
              </linearGradient>
            </defs>
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
                border: "1px solid #c9a961",
                borderRadius: 10,
                fontSize: 12,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
              labelStyle={{
                color: "#c9a961",
                fontWeight: 600,
                marginBottom: 4,
              }}
              itemStyle={{ color: "#f5f5f4" }}
              formatter={(value, name) => [
                formatBRL(Number(value)),
                String(name) === "previsto" ? "Previsto" : "Realizado",
              ]}
              cursor={{ fill: "rgba(201, 169, 97, 0.08)" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: COLORS.text,
                paddingTop: 8,
              }}
              formatter={(value: string) =>
                value === "previsto" ? "Previsto" : "Realizado"
              }
            />
            <Bar
              dataKey="previsto"
              fill="url(#gradPrevisto)"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="realizado"
              radius={[6, 6, 0, 0]}
            >
              {data.map((entry, index) => {
                const ehMesAtual = entry.mes?.startsWith(hojeMes);
                return (
                  <Cell
                    key={index}
                    fill={
                      ehMesAtual
                        ? "url(#gradRealizadoMesAtual)"
                        : "url(#gradRealizado)"
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
