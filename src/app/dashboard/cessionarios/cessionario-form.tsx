"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import {
  DocumentoInput,
  TelefoneInput,
} from "@/components/ui/masked-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  criarCessionario,
  atualizarCessionario,
  type CessionarioFormState,
} from "./actions";
import type { Cessionario } from "@/types/database";

const initial: CessionarioFormState = { error: null, fieldErrors: {} };

interface Props {
  cessionario?: Cessionario;
}

export function CessionarioForm({ cessionario }: Props) {
  const action = cessionario
    ? atualizarCessionario.bind(null, cessionario.id)
    : criarCessionario;
  const [state, formAction] = useActionState(action, initial);
  const e = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Tipo de pessoa
        </legend>
        <div className="flex gap-6 pt-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipo_pessoa"
              value="PJ"
              defaultChecked={(cessionario?.tipo_pessoa ?? "PJ") === "PJ"}
              className="h-4 w-4 accent-[var(--gold)]"
            />
            Pessoa Jurídica (CNPJ)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipo_pessoa"
              value="PF"
              defaultChecked={cessionario?.tipo_pessoa === "PF"}
              className="h-4 w-4 accent-[var(--gold)]"
            />
            Pessoa Física (CPF)
          </label>
        </div>
      </fieldset>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nome / Razão social" required error={e.nome}>
          <Input
            name="nome"
            defaultValue={cessionario?.nome ?? ""}
            placeholder="Nome completo ou razão social"
            required
          />
        </Field>
        <Field label="CPF ou CNPJ" required error={e.documento}>
          <DocumentoInput
            name="documento"
            defaultValue={cessionario?.documento ?? ""}
            required
          />
        </Field>
        <Field label="E-mail" error={e.email}>
          <Input
            name="email"
            type="email"
            defaultValue={cessionario?.email ?? ""}
          />
        </Field>
        <Field label="Telefone" error={e.telefone}>
          <TelefoneInput
            name="telefone"
            defaultValue={cessionario?.telefone ?? ""}
          />
        </Field>
      </section>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Dados do contrato
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field
            label="Data do contrato"
            error={e.data_contrato}
          >
            <Input
              name="data_contrato"
              type="date"
              defaultValue={cessionario?.data_contrato ?? ""}
            />
          </Field>
          <Field
            label="Valor contratado (R$)"
            error={e.valor_contratado}
          >
            <Input
              name="valor_contratado"
              type="number"
              step="0.01"
              min="0"
              defaultValue={cessionario?.valor_contratado ?? ""}
              placeholder="0,00"
            />
          </Field>
          <Field
            label="Valor da cessão (R$)"
            error={e.valor_cessao}
          >
            <Input
              name="valor_cessao"
              type="number"
              step="0.01"
              min="0"
              defaultValue={cessionario?.valor_cessao ?? ""}
              placeholder="0,00"
            />
          </Field>
          <Field
            label="Percentual (%)"
            error={e.percentual}
            hint="0 a 100"
          >
            <Input
              name="percentual"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={cessionario?.percentual ?? ""}
              placeholder="30"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Dados bancários (para repasse)
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Field label="Banco">
              <Input
                name="banco_nome"
                defaultValue={cessionario?.banco?.banco ?? ""}
                placeholder="Banco do Brasil"
              />
            </Field>
          </div>
          <Field label="Agência">
            <Input
              name="agencia"
              defaultValue={cessionario?.banco?.agencia ?? ""}
            />
          </Field>
          <Field label="Conta">
            <Input
              name="conta"
              defaultValue={cessionario?.banco?.conta ?? ""}
            />
          </Field>
          <Field label="Tipo de conta">
            <Select
              name="tipo_conta"
              defaultValue={cessionario?.banco?.tipo ?? ""}
            >
              <option value="">—</option>
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
            </Select>
          </Field>
          <div className="md:col-span-3">
            <Field label="Chave PIX">
              <Input
                name="pix"
                defaultValue={cessionario?.banco?.pix ?? ""}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <Field label="Observações">
        <Textarea
          name="observacoes"
          defaultValue={cessionario?.observacoes ?? ""}
          rows={3}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={cessionario?.ativo ?? true}
          className="h-4 w-4 rounded border-[var(--border)] bg-black/30 text-[var(--gold)] focus:ring-[var(--gold)]"
        />
        Cessionário ativo
      </label>

      <div className="flex items-center gap-3 pt-4">
        <Submit isEdit={!!cessionario} />
        <Link
          href="/dashboard/cessionarios"
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
      {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar cessionário"}
    </Button>
  );
}
