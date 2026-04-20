"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  definirPerguntaSeguranca,
  removerPerguntaSeguranca,
  type SegurancaActionResult,
} from "./actions";

const initial: SegurancaActionResult = { error: null };

interface Props {
  ativa: boolean;
  perguntaAtual: string;
}

export function SegurancaForm({ ativa, perguntaAtual }: Props) {
  const [state, formAction] = useActionState(
    definirPerguntaSeguranca,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [pendingRemocao, startRemocao] = useTransition();

  useEffect(() => {
    if (state.ok) {
      toast.success(state.mensagem ?? "Salvo");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function remover() {
    startRemocao(async () => {
      const res = await removerPerguntaSeguranca();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.mensagem ?? "Removida");
        setConfirmarRemocao(false);
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5 space-y-4">
          <Field
            label={ativa ? "Nova pergunta" : "Pergunta de segurança"}
            required
            hint="Algo pessoal que só você sabe — ex.: 'Nome do seu primeiro animal de estimação'"
          >
            <Input
              name="pergunta"
              defaultValue={perguntaAtual}
              placeholder="Qual o nome da sua filha(o)?"
              required
              minLength={5}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Resposta"
              required
              hint="Mínimo 3 caracteres. Ignora maiúsculas, acentos e espaços."
            >
              <Input
                name="resposta"
                type="text"
                autoComplete="off"
                required
                minLength={3}
                placeholder="Sua resposta"
              />
            </Field>
            <Field label="Confirmar resposta" required>
              <Input
                name="confirmacao"
                type="text"
                autoComplete="off"
                required
                minLength={3}
                placeholder="Digite novamente"
              />
            </Field>
          </div>

          <Field
            label="Confirme sua senha atual"
            required
            hint="Por segurança, pedimos sua senha para alterar a pergunta."
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

          <div className="flex flex-wrap gap-3 pt-2">
            <Submit ativa={ativa} />
            {ativa && !confirmarRemocao && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmarRemocao(true)}
                disabled={pendingRemocao}
              >
                Desativar 2FA
              </Button>
            )}
          </div>
        </div>
      </form>

      {confirmarRemocao && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-5">
          <p className="text-sm">
            <strong className="text-[var(--danger)]">Tem certeza?</strong> Sem
            pergunta de segurança, qualquer pessoa com sua senha pode acessar
            o sistema.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={remover}
              disabled={pendingRemocao}
            >
              {pendingRemocao ? "Removendo..." : "Sim, desativar 2FA"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmarRemocao(false)}
              disabled={pendingRemocao}
            >
              Manter ativo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Submit({ ativa }: { ativa: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Salvando..."
        : ativa
          ? "Atualizar pergunta"
          : "Ativar 2FA"}
    </Button>
  );
}
