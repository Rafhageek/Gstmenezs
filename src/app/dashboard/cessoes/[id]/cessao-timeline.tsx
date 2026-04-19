import { formatBRL } from "@/lib/format";
import type { TimelineEvento } from "@/types/database";

interface Props {
  eventos: TimelineEvento[];
}

export function CessaoTimeline({ eventos }: Props) {
  return (
    <ol className="relative space-y-0 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6">
      <div
        aria-hidden
        className="absolute left-9 top-8 bottom-8 w-px bg-[var(--border)]"
      />
      {eventos.map((ev, i) => (
        <li
          key={`${ev.evento_em}-${i}`}
          className="relative flex gap-4 py-3"
        >
          <EventoIcone tipo={ev.tipo} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{ev.descricao}</p>
              {ev.valor !== null && (
                <span
                  className={`font-mono text-xs ${
                    ev.tipo === "estorno"
                      ? "text-[var(--danger)]"
                      : ev.tipo === "pagamento"
                        ? "text-[var(--success)]"
                        : "text-[var(--muted)]"
                  }`}
                >
                  {ev.tipo === "estorno" ? "−" : ""}
                  {formatBRL(ev.valor)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {formatTimestamp(ev.evento_em)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function EventoIcone({ tipo }: { tipo: TimelineEvento["tipo"] }) {
  const map: Record<
    TimelineEvento["tipo"],
    { icon: string; bg: string; color: string }
  > = {
    cessao_criada: {
      icon: "+",
      bg: "bg-[var(--gold)]/15",
      color: "text-[var(--gold)]",
    },
    pagamento: {
      icon: "✓",
      bg: "bg-[var(--success)]/15",
      color: "text-[var(--success)]",
    },
    estorno: {
      icon: "↺",
      bg: "bg-[var(--danger)]/15",
      color: "text-[var(--danger)]",
    },
    pagamento_parcial: {
      icon: "◐",
      bg: "bg-[var(--warning)]/15",
      color: "text-[var(--warning)]",
    },
    cancelada: {
      icon: "×",
      bg: "bg-black/40",
      color: "text-[var(--muted)]",
    },
  };
  const s = map[tipo];
  return (
    <span
      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] ${s.bg} ${s.color} font-semibold`}
      aria-hidden
    >
      {s.icon}
    </span>
  );
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
