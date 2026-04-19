"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { criarLinkPortal } from "./actions";
import type { ClientePrincipal } from "@/types/database";

interface Props {
  clientes: Pick<ClientePrincipal, "id" | "nome" | "documento">[];
}

export function NovoLinkForm({ clientes }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [linkCriado, setLinkCriado] = useState<{
    token: string;
    url: string;
  } | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await criarLinkPortal(formData);
      if (res.error) {
        setError(res.error);
        toast.error("Erro", { description: res.error });
      } else if (res.token) {
        const url = `${window.location.origin}/portal/${res.token}`;
        setLinkCriado({ token: res.token, url });
        toast.success("Link criado — copie e compartilhe");
      }
    });
  }

  async function copiar() {
    if (!linkCriado) return;
    await navigator.clipboard.writeText(linkCriado.url);
    toast.success("Link copiado");
  }

  function fechar() {
    setOpen(false);
    setLinkCriado(null);
    setError(null);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>+ Novo link</Button>
    );
  }

  if (linkCriado) {
    return (
      <div className="mb-6 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
          Link gerado
        </p>
        <p className="mt-2 text-sm">
          Copie e envie ao contador (WhatsApp, e-mail, etc.). O mesmo link
          fica listado abaixo — você pode revogá-lo quando quiser.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/40 p-3">
          <input
            readOnly
            value={linkCriado.url}
            className="flex-1 truncate bg-transparent font-mono text-xs text-foreground outline-none"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button size="sm" onClick={copiar}>
            Copiar
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="ghost" onClick={fechar}>
            Fechar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setLinkCriado(null);
            }}
          >
            Criar outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5 space-y-4"
    >
      <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
        Novo link para contador
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Cliente" required>
          <Select name="cliente_id" required defaultValue="">
            <option value="" disabled>
              Selecione...
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Validade (dias)"
          hint="0 = sem expiração"
          required
        >
          <Input
            name="validade_dias"
            type="number"
            min="0"
            max="365"
            defaultValue={30}
            required
          />
        </Field>
      </div>

      <Field
        label="Descrição / identificação"
        required
        hint="Para quem é este link? Ex.: Contador João – São Paulo"
      >
        <Textarea
          name="descricao"
          rows={2}
          required
          placeholder="Contador João Silva – São Paulo"
        />
      </Field>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Gerando..." : "Gerar link"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={fechar}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
