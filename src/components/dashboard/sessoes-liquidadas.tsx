import Link from "next/link";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { CessaoLiquidada } from "@/types/database";

interface Props {
  cessoes: CessaoLiquidada[];
  valorTotal: number;
}

export function SessoesLiquidadas({ cessoes, valorTotal }: Props) {
  const qtd = cessoes.length;

  return (
    <div className="rounded-2xl border border-[var(--success)]/30 bg-gradient-to-br from-[var(--success)]/10 to-transparent p-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--success)]">
            Sessões Liquidadas
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            {qtd} cessão{qtd === 1 ? "" : "ões"} paga{qtd === 1 ? "" : "s"}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Valor total liquidado:{" "}
            <span className="font-mono font-semibold text-[var(--success)]">
              {formatBRL(valorTotal)}
            </span>
          </p>
        </div>
        {qtd > 0 && (
          <Link
            href="/dashboard/cessoes?filtro=liquidadas"
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Ver todas →
          </Link>
        )}
      </header>

      {qtd === 0 ? (
        <p className="py-4 text-sm text-[var(--muted)]">
          Nenhuma cessão liquidada ainda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Contrato</th>
                <th className="px-4 py-3 font-medium">Cliente / Cessionário</th>
                <th className="px-4 py-3 font-medium">Liquidada em</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cessoes.slice(0, 5).map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[var(--border)] hover:bg-black/20"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {c.numero_contrato}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.cliente_nome}</div>
                    <div className="text-xs text-[var(--muted)]">
                      → {c.cessionario_nome}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {formatDataBR(c.data_liquidacao)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--success)]">
                    {formatBRL(c.valor_total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/cessoes/${c.id}`}
                      className="text-xs text-[var(--gold)] hover:underline"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {cessoes.length > 5 && (
                <tr className="border-t border-[var(--border)]">
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-center text-xs text-[var(--muted)]"
                  >
                    + {cessoes.length - 5} liquidada
                    {cessoes.length - 5 === 1 ? "" : "s"} adicional
                    {cessoes.length - 5 === 1 ? "" : "is"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
