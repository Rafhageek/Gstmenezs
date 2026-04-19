"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";
import {
  registrarPagamento,
  estornarPagamento,
  getComprovanteUrl,
} from "@/app/dashboard/pagamentos/actions";
import { hojeISO, formatBRL } from "@/lib/format";

interface PagarProps {
  pagamentoId: string;
  valorSugerido: number;
  valorOriginal: number;
}

export function PagarParcelaButton({
  pagamentoId,
  valorSugerido,
  valorOriginal,
}: PagarProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorAtual, setValorAtual] = useState(valorSugerido);
  const [pending, startTransition] = useTransition();

  const isParcial = valorAtual < valorOriginal;
  const saldo = valorOriginal - valorAtual;

  function onSubmit(formData: FormData) {
    setError(null);
    if (isParcial) formData.set("parcial", "true");
    startTransition(async () => {
      const res = await registrarPagamento(formData);
      if (res.error) {
        setError(res.error);
        toast.error("Erro ao registrar pagamento", {
          description: res.error,
        });
      } else {
        setOpen(false);
        toast.success(
          isParcial
            ? `Pagamento parcial registrado — saldo de ${formatBRL(saldo)} gerado`
            : "Pagamento registrado",
        );
      }
    });
  }

  if (!open) {
    return (
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        Registrar pagamento
      </Button>
    );
  }

  return (
    <form
      action={onSubmit}
      className="rounded-lg border border-[var(--gold)]/40 bg-[var(--background-elevated)] p-4 space-y-3"
    >
      <input type="hidden" name="pagamento_id" value={pagamentoId} />
      <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
        Confirmar pagamento
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Data do pagamento" required>
          <Input
            name="data_pagamento"
            type="date"
            defaultValue={hojeISO()}
            required
          />
        </Field>
        <Field
          label="Valor recebido"
          hint={`Valor da parcela: ${formatBRL(valorOriginal)}`}
        >
          <Input
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            max={valorOriginal}
            value={valorAtual}
            onChange={(e) => setValorAtual(Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      {isParcial && saldo > 0 && (
        <Alert variant="warning">
          <strong>Pagamento parcial:</strong> será gerada automaticamente uma
          nova parcela de saldo no valor de <strong>{formatBRL(saldo)}</strong>{" "}
          com o mesmo vencimento.
        </Alert>
      )}

      <Field label="Observações">
        <Textarea name="observacoes" rows={2} placeholder="Notas opcionais" />
      </Field>

      <Field label="Comprovante (PDF/imagem)">
        <input
          name="comprovante"
          type="file"
          accept="application/pdf,image/*"
          className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-[var(--gold)]/20 file:px-3 file:py-1.5 file:text-[var(--gold)] hover:file:bg-[var(--gold)]/30"
        />
      </Field>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Registrando..." : "Confirmar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function EstornarButton({ pagamentoId }: { pagamentoId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await estornarPagamento(formData);
      if (res.error) {
        setError(res.error);
        toast.error("Erro ao estornar", { description: res.error });
      } else {
        setOpen(false);
        toast.success("Pagamento estornado");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Estornar
      </Button>
    );
  }

  return (
    <form
      action={onSubmit}
      className="rounded-lg border border-[var(--danger)]/40 bg-[var(--background-elevated)] p-4 space-y-3"
    >
      <input type="hidden" name="pagamento_id" value={pagamentoId} />
      <p className="text-xs uppercase tracking-wide text-[var(--danger)]">
        Estornar pagamento
      </p>
      <p className="text-xs text-[var(--muted)]">
        Cria um lançamento contrário (não apaga o original — preserva auditoria).
      </p>

      <Field label="Motivo do estorno" required>
        <Textarea
          name="motivo"
          rows={2}
          required
          placeholder="Ex.: cheque devolvido, valor incorreto..."
        />
      </Field>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Estornando..." : "Confirmar estorno"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function VerComprovanteLink({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const url = await getComprovanteUrl(path);
    setLoading(false);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Não foi possível gerar link do comprovante");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-xs text-[var(--gold)] hover:underline disabled:opacity-60"
      title="Abrir comprovante (link válido por 5 minutos)"
    >
      {loading ? "..." : "📎 Ver comprovante"}
    </button>
  );
}
