"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { criarUsuario } from "../actions";

export function NovoUsuarioForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await criarUsuario(formData);
      if (res.error) setError(res.error);
      else {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/admin/usuarios"), 1200);
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && (
        <Alert variant="success">
          Usuário criado com sucesso. Redirecionando...
        </Alert>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nome completo" required>
          <Input
            name="nome"
            placeholder="Dr(a). Nome Sobrenome"
            required
          />
        </Field>
        <Field label="E-mail" required>
          <Input
            name="email"
            type="email"
            placeholder="advogado@menezes.adv.br"
            required
          />
        </Field>
        <Field
          label="Senha inicial"
          required
          hint="Mínimo 8 caracteres. Comunique ao usuário e oriente a alterar no primeiro acesso."
        >
          <Input
            name="senha"
            type="password"
            minLength={8}
            required
          />
        </Field>
        <Field label="Perfil de acesso" required>
          <Select name="role" defaultValue="financeiro" required>
            <option value="admin">Administrador</option>
            <option value="financeiro">Financeiro</option>
            <option value="contador">Contador</option>
          </Select>
        </Field>
        <Field label="OAB (opcional)">
          <Input name="oab" placeholder="123456/SP" />
        </Field>
      </section>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar usuário"}
        </Button>
        <Link
          href="/dashboard/admin/usuarios"
          className="text-sm text-[var(--muted)] hover:text-foreground"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
