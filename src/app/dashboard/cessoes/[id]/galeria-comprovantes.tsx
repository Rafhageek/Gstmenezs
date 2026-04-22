"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getComprovantesUrls } from "@/app/dashboard/pagamentos/actions";
import { formatBRL, formatDataBR } from "@/lib/format";

interface ItemComprovante {
  pagamentoId: string;
  numeroParcela: number;
  valor: number;
  dataPagamento: string | null;
  path: string;
}

interface Props {
  itens: ItemComprovante[];
}

/**
 * Galeria de comprovantes de uma cessão: carrega todas as signed URLs em batch
 * e mostra miniaturas (imagens) ou ícone "PDF" (PDFs). Tudo clicável.
 */
export function GaleriaComprovantes({ itens }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      if (itens.length === 0) {
        setLoading(false);
        return;
      }
      const paths = itens.map((i) => i.path);
      const mapa = await getComprovantesUrls(paths);
      if (!cancelado) {
        setUrls(mapa);
        setLoading(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [itens]);

  if (itens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-8 text-center">
        <p className="text-sm text-[var(--muted)]">
          Nenhum comprovante anexado a esta cessão ainda.
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]/70">
          Anexe comprovantes nas parcelas pagas pra vê-los todos aqui.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {itens.map((i) => (
          <div
            key={i.pagamentoId}
            className="aspect-square animate-pulse rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {itens.map((item) => {
        const url = urls[item.path];
        const isPdf = item.path.toLowerCase().endsWith(".pdf");
        return (
          <article
            key={item.pagamentoId}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] transition-colors hover:border-[var(--gold)]/60"
          >
            <button
              type="button"
              onClick={() => {
                if (url) window.open(url, "_blank", "noopener,noreferrer");
                else toast.error("Link indisponível — recarregue a página");
              }}
              className="block aspect-square w-full overflow-hidden bg-black/30"
              title={`Abrir comprovante da parcela ${item.numeroParcela}`}
            >
              {url && !isPdf ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={`Comprovante parcela ${item.numeroParcela}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--gold)]">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <span className="font-mono text-xs">PDF</span>
                </div>
              )}
            </button>
            <div className="border-t border-[var(--border)] p-3">
              <p className="text-xs font-semibold">
                Parcela {item.numeroParcela}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                {item.dataPagamento
                  ? formatDataBR(item.dataPagamento)
                  : "sem data"}{" "}
                · {formatBRL(item.valor)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
