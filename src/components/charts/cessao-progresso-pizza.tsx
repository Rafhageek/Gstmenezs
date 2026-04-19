"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { formatBRL } from "@/lib/format";

interface Props {
  valorPago: number;
  saldoDevedor: number;
  size?: number;
}

/**
 * Pizza compacta usada por cessão (na lista) — mostra % pago.
 * Atendimento direto ao pedido do cliente: "gráfico de pizza por cessão".
 */
export function CessaoProgressoPizza({
  valorPago,
  saldoDevedor,
  size = 80,
}: Props) {
  const total = valorPago + saldoDevedor;
  const pct = total > 0 ? (valorPago / total) * 100 : 0;
  const data = [
    { name: "Pago", value: valorPago },
    { name: "Saldo", value: saldoDevedor },
  ];

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.32}
            outerRadius={size * 0.45}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="#0a1628"
            strokeWidth={1.5}
          >
            <Cell fill="#10b981" />
            <Cell fill="#1e3a5f" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        title={`Pago: ${formatBRL(valorPago)}\nSaldo: ${formatBRL(saldoDevedor)}`}
      >
        <span className="text-[11px] font-semibold leading-none text-[var(--gold)]">
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
