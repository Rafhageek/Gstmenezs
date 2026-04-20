"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { verificar2fa, type Verificacao2faState } from "./actions";

const initial: Verificacao2faState = { error: null };

export function Verificacao2faForm() {
  const [state, formAction] = useActionState(verificar2fa, initial);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Resposta" required>
        <Input
          name="resposta"
          type="text"
          autoComplete="off"
          autoFocus
          required
          placeholder="Sua resposta"
        />
      </Field>

      {state.error && (
        <Alert variant={state.bloqueado ? "danger" : "warning"}>
          <strong>{state.error}</strong>
          {state.tentativasRestantes !== undefined && (
            <span className="ml-1 text-xs">
              ({state.tentativasRestantes}{" "}
              {state.tentativasRestantes === 1
                ? "tentativa restante"
                : "tentativas restantes"}
              )
            </span>
          )}
        </Alert>
      )}

      <Submit />

      <p className="pt-2 text-center text-[11px] text-[var(--muted)]/70">
        Maiúsculas, minúsculas, acentos e espaços são ignorados.
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Verificando..." : "Confirmar e entrar"}
    </Button>
  );
}
