"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import {
  DocumentoInput,
  TelefoneInput,
  CepInput,
} from "@/components/ui/masked-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  criarCliente,
  atualizarCliente,
  type ClienteFormState,
} from "./actions";
import type { ClientePrincipal } from "@/types/database";

const initial: ClienteFormState = { error: null, fieldErrors: {} };

const UFs = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

interface Props {
  cliente?: ClientePrincipal;
}

export function ClienteForm({ cliente }: Props) {
  const action = cliente
    ? atualizarCliente.bind(null, cliente.id)
    : criarCliente;
  const [state, formAction] = useActionState(action, initial);

  const e = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nome / Razão social" required error={e.nome}>
          <Input
            name="nome"
            defaultValue={cliente?.nome ?? ""}
            placeholder="Nome completo ou razão social"
            required
          />
        </Field>
        <Field label="CPF ou CNPJ" required error={e.documento}>
          <DocumentoInput
            name="documento"
            defaultValue={cliente?.documento ?? ""}
            required
          />
        </Field>
        <Field label="E-mail" error={e.email}>
          <Input
            name="email"
            type="email"
            defaultValue={cliente?.email ?? ""}
            placeholder="contato@cliente.com"
          />
        </Field>
        <Field label="Telefone" error={e.telefone}>
          <TelefoneInput
            name="telefone"
            defaultValue={cliente?.telefone ?? ""}
          />
        </Field>
      </section>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Endereço (opcional)
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <Field label="CEP">
              <CepInput
                name="cep"
                defaultValue={cliente?.endereco?.cep ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Logradouro">
              <Input
                name="logradouro"
                defaultValue={cliente?.endereco?.logradouro ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-1">
            <Field label="Número">
              <Input
                name="numero"
                defaultValue={cliente?.endereco?.numero ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Complemento">
              <Input
                name="complemento"
                defaultValue={cliente?.endereco?.complemento ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Bairro">
              <Input
                name="bairro"
                defaultValue={cliente?.endereco?.bairro ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-1">
            <Field label="UF">
              <Select name="uf" defaultValue={cliente?.endereco?.uf ?? ""}>
                <option value="">—</option>
                {UFs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Cidade">
              <Input
                name="cidade"
                defaultValue={cliente?.endereco?.cidade ?? ""}
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <Field label="Observações">
        <Textarea
          name="observacoes"
          defaultValue={cliente?.observacoes ?? ""}
          placeholder="Notas internas sobre este cliente..."
          rows={3}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={cliente?.ativo ?? true}
          className="h-4 w-4 rounded border-[var(--border)] bg-black/30 text-[var(--gold)] focus:ring-[var(--gold)]"
        />
        Cliente ativo
      </label>

      <div className="flex items-center gap-3 pt-4">
        <Submit isEdit={!!cliente} />
        <Link
          href="/dashboard/clientes"
          className="text-sm text-[var(--muted)] hover:text-foreground"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar cliente"}
    </Button>
  );
}
