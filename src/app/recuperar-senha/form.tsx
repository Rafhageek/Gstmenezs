"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { solicitarRecuperacao, type RecuperarSenhaState } from "./actions";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";

const initial: RecuperarSenhaState = { error: null, ok: false };

export function RecuperarSenhaForm() {
  const [state, formAction] = useActionState(solicitarRecuperacao, initial);

  if (state.ok) {
    return (
      <div className="mt-6">
        <Alert variant="success">
          <strong>E-mail enviado.</strong> Se a conta existir, você receberá
          em instantes um link para redefinir a senha. Verifique também sua
          caixa de spam.
        </Alert>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="E-mail cadastrado" required>
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="advogado@menezes.adv.br"
        />
      </Field>

      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Enviando..." : "Enviar link de recuperação"}
    </Button>
  );
}
