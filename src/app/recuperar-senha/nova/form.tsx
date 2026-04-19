"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { definirNovaSenha, type RecuperarSenhaState } from "../actions";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";

const initial: RecuperarSenhaState = { error: null, ok: false };

export function NovaSenhaForm() {
  const [state, formAction] = useActionState(definirNovaSenha, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      toast.success("Senha redefinida");
      setTimeout(() => router.push("/dashboard"), 1200);
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Nova senha" required hint="Mínimo 8 caracteres">
        <Input
          name="senha"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </Field>
      <Field label="Confirmar senha" required>
        <Input
          name="confirmacao"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
      </Field>

      {state.error && <Alert variant="danger">{state.error}</Alert>}
      {state.ok && <Alert variant="success">Senha atualizada!</Alert>}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Salvando..." : "Definir nova senha"}
    </Button>
  );
}
