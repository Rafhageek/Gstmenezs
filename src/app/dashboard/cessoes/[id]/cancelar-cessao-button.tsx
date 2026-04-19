"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";
import { cancelarCessao } from "../actions";

export function CancelarCessaoButton({
  cessaoId,
  numeroContrato,
}: {
  cessaoId: string;
  numeroContrato: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await cancelarCessao(cessaoId);
      if (res.error) {
        setError(res.error);
        toast.error("Erro ao cancelar", { description: res.error });
      } else {
        toast.success(`Cessão ${numeroContrato} cancelada`);
        router.push("/dashboard/cessoes");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Cancelar cessão
      </Button>
    );
  }

  const matches = confirmText.trim() === numeroContrato;

  return (
    <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-[var(--danger)]">
        Confirmar cancelamento
      </p>
      <p className="text-sm">
        A cessão será marcada como <strong>Cancelada</strong>. As parcelas e
        pagamentos existentes serão preservados para histórico e auditoria, mas
        a cessão não aparecerá mais na lista ativa.
      </p>
      <Field
        label={`Digite o número do contrato para confirmar: ${numeroContrato}`}
        required
      >
        <Textarea
          rows={1}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={numeroContrato}
        />
      </Field>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onConfirm}
          disabled={pending || !matches}
        >
          {pending ? "Cancelando..." : "Confirmar cancelamento"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}
