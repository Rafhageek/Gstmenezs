"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/feedback";
import {
  atualizarRole,
  alternarAtivo,
  resetarSenha,
} from "./actions";
import type { UserRole } from "@/types/database";

export function MudarRoleSelect({
  userId,
  roleAtual,
  isSelf,
}: {
  userId: string;
  roleAtual: UserRole;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value as UserRole;
    if (novo === roleAtual) return;
    setError(null);
    startTransition(async () => {
      const res = await atualizarRole(userId, novo);
      if (res.error) {
        setError(res.error);
        toast.error("Erro", { description: res.error });
      } else {
        toast.success(`Perfil atualizado para ${novo}`);
      }
    });
  }

  return (
    <div>
      <Select
        defaultValue={roleAtual}
        onChange={onChange}
        disabled={pending || isSelf}
        className="text-xs"
        title={isSelf ? "Você não pode alterar seu próprio perfil" : ""}
      >
        <option value="admin">Administrador</option>
        <option value="financeiro">Financeiro</option>
        <option value="contador">Contador</option>
      </Select>
      {error && (
        <p className="mt-1 text-[10px] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}

export function AlternarAtivoButton({
  userId,
  ativo,
  isSelf,
}: {
  userId: string;
  ativo: boolean;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await alternarAtivo(userId, !ativo);
      if (res.error) {
        setError(res.error);
        toast.error("Erro", { description: res.error });
      } else {
        toast.success(ativo ? "Usuário desativado" : "Usuário ativado");
      }
    });
  }

  return (
    <div>
      <Button
        size="sm"
        variant={ativo ? "ghost" : "secondary"}
        onClick={onClick}
        disabled={pending || isSelf}
        title={isSelf ? "Você não pode desativar a si mesmo" : ""}
      >
        {pending ? "..." : ativo ? "Desativar" : "Ativar"}
      </Button>
      {error && (
        <p className="mt-1 text-[10px] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}

export function ResetarSenhaButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    const novaSenha = String(formData.get("nova_senha") ?? "");
    startTransition(async () => {
      const res = await resetarSenha(userId, novaSenha);
      if (res.error) setError(res.error);
      else {
        setSuccess(true);
        setTimeout(() => setOpen(false), 1800);
      }
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Resetar senha
      </Button>
    );
  }

  return (
    <form
      action={onSubmit}
      className="rounded-lg border border-[var(--gold)]/40 bg-[var(--background-elevated)] p-3 space-y-2"
    >
      <Field label="Nova senha" required>
        <Input
          name="nova_senha"
          type="password"
          minLength={8}
          required
          placeholder="Mínimo 8 caracteres"
        />
      </Field>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Senha redefinida.</Alert>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "..." : "Confirmar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
