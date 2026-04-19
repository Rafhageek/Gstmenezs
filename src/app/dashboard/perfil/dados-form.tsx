"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import {
  atualizarDadosPerfil,
  type PerfilActionResult,
} from "./actions";
import type { Profile, UserRole } from "@/types/database";

const initial: PerfilActionResult = { error: null };

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  financeiro: "Financeiro",
  contador: "Contador",
};

export function DadosPerfilForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(atualizarDadosPerfil, initial);

  useEffect(() => {
    if (state.ok) toast.success(state.mensagem ?? "Salvo");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Info não editável */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              E-mail
            </p>
            <p className="mt-1 font-mono text-sm">{profile.email}</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]/70">
              Altere na aba <strong>E-mail e senha</strong>.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              Perfil de acesso
            </p>
            <p className="mt-2">
              <Badge variant="gold">{ROLE_LABEL[profile.role]}</Badge>
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)]/70">
              Apenas admin pode alterar.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              Cadastrado em
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {new Date(profile.created_at).toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
            </p>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <Field
          label="Nome completo"
          required
          hint="Aparece na tela de boas-vindas e nos PDFs gerados por você."
        >
          <Input
            name="nome"
            defaultValue={profile.nome}
            required
            minLength={3}
          />
        </Field>

        <Field
          label="OAB (opcional)"
          hint="Número e UF da OAB. Aparece em logs e relatórios sensíveis."
        >
          <Input
            name="oab"
            defaultValue={profile.oab ?? ""}
            placeholder="Ex.: 123456/SP"
          />
        </Field>

        {state.error && <Alert variant="danger">{state.error}</Alert>}
        {state.ok && <Alert variant="success">{state.mensagem}</Alert>}

        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar dados"}
    </Button>
  );
}
