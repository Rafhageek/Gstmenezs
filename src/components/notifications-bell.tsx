"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { ParcelaProxima, InadimplenciaItem } from "@/types/database";

interface Props {
  proximas: ParcelaProxima[];
  atrasadas: InadimplenciaItem[];
}

export function NotificationsBell({ proximas, atrasadas }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const total = proximas.length + atrasadas.length;
  const temUrgente = atrasadas.length > 0;

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("click", onClickAway);
      document.addEventListener("keydown", onEsc);
      return () => {
        document.removeEventListener("click", onClickAway);
        document.removeEventListener("keydown", onEsc);
      };
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`${total} notificações`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--gold)] hover:text-foreground"
      >
        <BellIcon />
        {total > 0 && (
          <span
            className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
              temUrgente
                ? "bg-[var(--danger)] text-white"
                : "bg-[var(--gold)] text-[var(--background)]"
            }`}
          >
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in-up absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl shadow-black/50">
          <header className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Notificações
            </p>
            <p className="mt-1 text-sm font-semibold">
              {total === 0
                ? "Tudo em dia"
                : `${total} ${total === 1 ? "item" : "itens"} para atenção`}
            </p>
          </header>

          <div className="max-h-[480px] overflow-y-auto">
            {atrasadas.length > 0 && (
              <Secao
                titulo={`Em atraso (${atrasadas.length})`}
                cor="danger"
              >
                {atrasadas.slice(0, 5).map((i) => (
                  <LinhaNotificacao
                    key={i.pagamento_id}
                    href={`/dashboard/cessoes/${i.cessao_id}`}
                    onClick={() => setOpen(false)}
                    titulo={i.cliente_nome}
                    descricao={`Contrato ${i.numero_contrato} · Parc. ${i.numero_parcela}`}
                    valor={formatBRL(i.valor)}
                    meta={`${i.dias_atraso} dia${i.dias_atraso === 1 ? "" : "s"} de atraso`}
                    cor="danger"
                  />
                ))}
                {atrasadas.length > 5 && (
                  <Link
                    href="/dashboard/pagamentos?filtro=atrasados"
                    onClick={() => setOpen(false)}
                    className="block border-t border-[var(--border)] px-4 py-2 text-center text-xs text-[var(--gold)] hover:underline"
                  >
                    Ver todas ({atrasadas.length}) →
                  </Link>
                )}
              </Secao>
            )}

            {proximas.length > 0 && (
              <Secao
                titulo={`Vencem nos próximos 7 dias (${proximas.length})`}
                cor="gold"
              >
                {proximas.slice(0, 5).map((p) => (
                  <LinhaNotificacao
                    key={p.pagamento_id}
                    href={`/dashboard/cessoes/${p.cessao_id}`}
                    onClick={() => setOpen(false)}
                    titulo={p.cliente_nome}
                    descricao={`Contrato ${p.numero_contrato} · Parc. ${p.numero_parcela}`}
                    valor={formatBRL(p.valor)}
                    meta={
                      p.dias_ate_vencer === 0
                        ? "Vence hoje"
                        : `Em ${p.dias_ate_vencer} dia${p.dias_ate_vencer === 1 ? "" : "s"} · ${formatDataBR(p.data_vencimento)}`
                    }
                    cor="gold"
                  />
                ))}
                {proximas.length > 5 && (
                  <Link
                    href="/dashboard/agenda"
                    onClick={() => setOpen(false)}
                    className="block border-t border-[var(--border)] px-4 py-2 text-center text-xs text-[var(--gold)] hover:underline"
                  >
                    Ver agenda completa →
                  </Link>
                )}
              </Secao>
            )}

            {total === 0 && (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]">
                  ✓
                </div>
                <p className="text-sm">Sem pendências</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Nenhuma parcela vence nos próximos 7 dias e tudo está em dia.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Secao({
  titulo,
  cor,
  children,
}: {
  titulo: string;
  cor: "danger" | "gold";
  children: React.ReactNode;
}) {
  const corMap = {
    danger: "text-[var(--danger)]",
    gold: "text-[var(--gold)]",
  };
  return (
    <section className="border-b border-[var(--border)] last:border-b-0">
      <header className="bg-black/30 px-4 py-2">
        <p
          className={`text-[10px] font-semibold uppercase tracking-wide ${corMap[cor]}`}
        >
          {titulo}
        </p>
      </header>
      <ul>{children}</ul>
    </section>
  );
}

function LinhaNotificacao({
  href,
  onClick,
  titulo,
  descricao,
  valor,
  meta,
  cor,
}: {
  href: string;
  onClick: () => void;
  titulo: string;
  descricao: string;
  valor: string;
  meta: string;
  cor: "danger" | "gold";
}) {
  const corMap = {
    danger: "text-[var(--danger)]",
    gold: "text-[var(--gold)]",
  };
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="block border-t border-[var(--border)] px-4 py-3 transition-colors hover:bg-black/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{titulo}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
              {descricao}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`font-mono text-sm ${corMap[cor]}`}>{valor}</p>
            <p className={`mt-0.5 text-[10px] ${corMap[cor]}`}>{meta}</p>
          </div>
        </div>
      </Link>
    </li>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
