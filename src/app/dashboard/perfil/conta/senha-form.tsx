"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  alterarSenha,
  type PerfilActionResult,
} from "../actions";

const initial: PerfilActionResult = { error: null };

export function SenhaForm() {
  const [state, formAction] = useActionState(alterarSenha, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.mensagem ?? "Senha alterada");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field label="Senha atual" required>
        <Input
          name="senha_atual"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Nova senha"
          required
          hint="Mínimo 8 caracteres"
        >
          <Input
            name="nova_senha"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar nova senha" required>
          <Input
            name="confirmacao"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </Field>
      </div>

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
      {pending ? "Alterando..." : "Alterar senha"}
    </Button>
  );
}
