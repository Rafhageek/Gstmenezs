"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  alterarEmail,
  type PerfilActionResult,
} from "../actions";

const initial: PerfilActionResult = { error: null };

export function EmailForm({ emailAtual }: { emailAtual: string }) {
  const [state, formAction] = useActionState(alterarEmail, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.mensagem ?? "Solicitação enviada");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field label="E-mail atual">
        <Input value={emailAtual} disabled readOnly />
      </Field>

      <Field label="Novo e-mail" required>
        <Input
          name="email"
          type="email"
          required
          placeholder="novo@exemplo.com"
          autoComplete="email"
        />
      </Field>

      <Field
        label="Confirme sua senha atual"
        required
        hint="Por segurança, confirmamos sua identidade antes de alterar o e-mail."
      >
        <Input
          name="senha_atual"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>

      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.ok && <Alert variant="success">{state.mensagem}</Alert>}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enviando..." : "Alterar e-mail"}
    </Button>
  );
}
