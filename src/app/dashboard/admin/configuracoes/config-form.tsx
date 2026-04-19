"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import {
  DocumentoInput,
  TelefoneInput,
  CepInput,
} from "@/components/ui/masked-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  salvarConfiguracoes,
  type ConfigFormState,
} from "./actions";
import type { Configuracoes } from "@/types/database";

const initial: ConfigFormState = { error: null };

const UFs = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

interface Props {
  config: Configuracoes;
}

export function ConfigForm({ config }: Props) {
  const [state, formAction] = useActionState(salvarConfiguracoes, initial);

  useEffect(() => {
    if (state.ok) toast.success("Configurações salvas");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Identificação
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Razão social" required>
            <Input
              name="razao_social"
              defaultValue={config.razao_social}
              required
            />
          </Field>
          <Field label="Nome fantasia">
            <Input
              name="nome_fantasia"
              defaultValue={config.nome_fantasia ?? ""}
            />
          </Field>
          <Field label="CNPJ">
            <DocumentoInput name="cnpj" defaultValue={config.cnpj ?? ""} />
          </Field>
          <Field label="OAB responsável">
            <Input name="oab" defaultValue={config.oab ?? ""} placeholder="123456/SP" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Contato
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Telefone">
            <TelefoneInput name="telefone" defaultValue={config.telefone ?? ""} />
          </Field>
          <Field label="E-mail">
            <Input
              name="email"
              type="email"
              defaultValue={config.email ?? ""}
            />
          </Field>
          <Field label="Site">
            <Input
              name="site"
              placeholder="https://menezesadvocacia.com.br"
              defaultValue={config.site ?? ""}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Endereço do escritório
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <Field label="CEP">
              <CepInput name="cep" defaultValue={config.endereco?.cep ?? ""} />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Logradouro">
              <Input
                name="logradouro"
                defaultValue={config.endereco?.logradouro ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-1">
            <Field label="Número">
              <Input
                name="numero"
                defaultValue={config.endereco?.numero ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Complemento">
              <Input
                name="complemento"
                defaultValue={config.endereco?.complemento ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Bairro">
              <Input
                name="bairro"
                defaultValue={config.endereco?.bairro ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-1">
            <Field label="UF">
              <Select name="uf" defaultValue={config.endereco?.uf ?? ""}>
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
                defaultValue={config.endereco?.cidade ?? ""}
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Relatórios PDF
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Cor primária"
            hint="Usada em destaques dos PDFs (hex: #c9a961)"
          >
            <Input
              name="cor_primaria"
              type="text"
              defaultValue={config.cor_primaria ?? "#c9a961"}
              placeholder="#c9a961"
            />
          </Field>
          <Field
            label="Legenda do rodapé"
            hint="Texto exibido no rodapé dos relatórios"
          >
            <Input
              name="legenda_pdf"
              defaultValue={config.legenda_pdf ?? ""}
              placeholder="Documento gerado pelo sistema Painel MNZ"
            />
          </Field>
        </div>
      </fieldset>

      <Field
        label=""
        hint="Para alterar a logomarca, salve o arquivo em public/logo.png no servidor"
      >
        <Textarea
          name="_info"
          defaultValue=""
          rows={1}
          disabled
          className="opacity-0 h-0 p-0"
        />
      </Field>

      <div className="flex items-center gap-3">
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar configurações"}
    </Button>
  );
}
