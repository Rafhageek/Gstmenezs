import Link from "next/link";
import { formatBRL } from "@/lib/format";
import type { AgingBucket } from "@/types/database";

const LABELS: Record<AgingBucket["bucket"], { label: string; color: string }> = {
  ate_30: { label: "0-30 dias", color: "var(--warning)" },
  de_31_60: { label: "31-60 dias", color: "#f97316" },
  de_61_90: { label: "61-90 dias", color: "#ef4444" },
  acima_90: { label: "90+ dias", color: "#991b1b" },
};

const ORDEM: AgingBucket["bucket"][] = [
  "ate_30",
  "de_31_60",
  "de_61_90",
  "acima_90",
];

export function AgingBuckets({ data }: { data: AgingBucket[] }) {
  const porBucket = new Map<AgingBucket["bucket"], AgingBucket>(
    data.map((b) => [b.bucket, b]),
  );
  const totais = ORDEM.map(
    (key) => porBucket.get(key) ?? { bucket: key, valor: 0, qtd: 0 },
  );
  const total = totais.reduce((s, b) => s + Number(b.valor), 0);
  const totalQtd = totais.reduce((s, b) => s + Number(b.qtd), 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Aging (atrasos)
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]/70">
            Classificação do saldo em atraso por tempo
          </p>
        </div>
        {totalQtd > 0 && (
          <Link
            href="/dashboard/pagamentos?filtro=atrasados"
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Ver detalhes →
          </Link>
        )}
      </header>

      {total === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-[var(--success)]">
            ✓ Carteira em dia
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Nenhuma parcela em atraso.
          </p>
        </div>
      ) : (
        <>
          {/* Barra de proporção */}
          <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-black/40">
            {totais.map((b) => {
              const pct = total > 0 ? (Number(b.valor) / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={b.bucket}
                  style={{
                    width: `${pct}%`,
                    background: LABELS[b.bucket].color,
                  }}
                  title={`${LABELS[b.bucket].label}: ${formatBRL(b.valor)}`}
                />
              );
            })}
          </div>

          {/* Linhas por bucket */}
          <div className="space-y-2">
            {totais.map((b) => {
              const pct = total > 0 ? (Number(b.valor) / total) * 100 : 0;
              return (
                <div
                  key={b.bucket}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: LABELS[b.bucket].color }}
                    />
                    <span>{LABELS[b.bucket].label}</span>
                    <span className="text-xs text-[var(--muted)]">
                      ({b.qtd})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{formatBRL(b.valor)}</div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm">
            <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Total em atraso
            </span>
            <span className="font-mono font-semibold text-[var(--danger)]">
              {formatBRL(total)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
