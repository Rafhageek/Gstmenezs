"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { popularDemo, limparDemo } from "./actions";

interface Props {
  totalRegistros: number;
}

export function DemoClient({ totalRegistros }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);

  function handlePopular() {
    startTransition(async () => {
      const res = await popularDemo();
      if (!res.ok) {
        toast.error(res.mensagem);
        return;
      }
      const d = res.detalhes;
      toast.success(
        d
          ? `Populado: ${d.clientes} clientes · ${d.cessionarios} cessionários · ${d.cessoes} cessões`
          : res.mensagem,
      );
    });
  }

  function handleLimpar() {
    startTransition(async () => {
      const res = await limparDemo();
      if (!res.ok) {
        toast.error(res.mensagem);
        return;
      }
      const d = res.detalhes;
      toast.success(
        d
          ? `Apagado: ${d.clientes} clientes · ${d.cessionarios} cessionários · ${d.cessoes} cessões · ${d.pagamentos} pagamentos`
          : res.mensagem,
      );
      setConfirmarLimpeza(false);
    });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
        <header className="mb-3">
          <h2 className="text-sm font-semibold">Popular dados fictícios</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Cria clientes, cessionários, cessões e pagamentos de exemplo.
            Idempotente — rodar de novo não duplica.
          </p>
        </header>
        <Button
          type="button"
          onClick={handlePopular}
          disabled={pending}
          variant="primary"
        >
          {pending ? "Populando..." : totalRegistros > 0
            ? "↻ Repopular (idempotente)"
            : "+ Popular dados demo"}
        </Button>
      </div>

      {totalRegistros > 0 && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-5">
          <header className="mb-3">
            <h2 className="text-sm font-semibold text-[var(--danger)]">
              Apagar dados fictícios
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Remove apenas registros com marcador{" "}
              <code className="rounded bg-black/30 px-1">[DEMO]</code>. Dados
              reais do escritório não são afetados.
            </p>
          </header>

          {!confirmarLimpeza ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => setConfirmarLimpeza(true)}
              disabled={pending}
            >
              🗑 Apagar dados demo
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                <strong className="text-[var(--danger)]">Confirmar?</strong>{" "}
                Isso vai apagar{" "}
                <strong className="font-mono">{totalRegistros}</strong>{" "}
                registros fictícios permanentemente.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleLimpar}
                  disabled={pending}
                >
                  {pending ? "Apagando..." : "Sim, apagar tudo"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmarLimpeza(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
