"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  criarCessao,
  atualizarCessao,
  type CessaoFormState,
} from "./actions";
import type {
  CessaoCredito,
  ClientePrincipal,
  Cessionario,
} from "@/types/database";
import { hojeISO } from "@/lib/format";

const initial: CessaoFormState = { error: null, fieldErrors: {} };

interface Props {
  cessao?: CessaoCredito;
  clientes: Pick<ClientePrincipal, "id" | "nome" | "documento">[];
  cessionarios: Pick<Cessionario, "id" | "nome" | "documento">[];
}

export function CessaoForm({ cessao, clientes, cessionarios }: Props) {
  const isEdit = !!cessao;
  const action = cessao
    ? atualizarCessao.bind(null, cessao.id)
    : criarCessao;
  const [state, formAction] = useActionState(action, initial);
  const e = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="danger">{state.error}</Alert>}

      {isEdit && (
        <Alert variant="warning">
          Após criada, valor total, parcelas e datas <strong>não podem</strong>{" "}
          ser alterados — isso poderia bagunçar as parcelas e pagamentos
          já registrados. Cancele a cessão e crie uma nova caso precise.
        </Alert>
      )}

      {!isEdit && (
        <Alert variant="info">
          O sistema gera as parcelas com <strong>valores iguais</strong>. Se
          você precisa de <strong>parcelas variáveis</strong>, crie a cessão
          normalmente e depois edite o valor/vencimento de cada parcela pelo
          botão <span className="font-mono">✏ Editar</span> na tabela.
        </Alert>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Número do contrato"
          required
          error={e.numero_contrato}
          hint="Identificação única (ex.: 2026/001)"
        >
          <Input
            name="numero_contrato"
            defaultValue={cessao?.numero_contrato ?? ""}
            placeholder="2026/001"
            required
          />
        </Field>
        <Field label="Taxa de juros (% ao mês)" error={e.taxa_juros}>
          <Input
            name="taxa_juros"
            type="number"
            step="0.01"
            min="0"
            defaultValue={cessao?.taxa_juros ?? 0}
          />
        </Field>

        <Field
          label="Percentual cedido (%)"
          error={e.percentual_cedido}
          hint="Até 4 casas decimais. Ex: 0,016 ou 30"
        >
          <Input
            name="percentual_cedido"
            type="number"
            step="0.0001"
            min="0"
            max="100"
            defaultValue={cessao?.percentual_cedido ?? ""}
            placeholder="0,016"
          />
        </Field>

        <Field label="Cliente principal (cedente)" required error={e.cliente_principal_id}>
          <Select
            name="cliente_principal_id"
            defaultValue={cessao?.cliente_principal_id ?? ""}
            required
            disabled={isEdit}
          >
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cessionário (recebedor)" required error={e.cessionario_id}>
          <Select
            name="cessionario_id"
            defaultValue={cessao?.cessionario_id ?? ""}
            required
            disabled={isEdit}
          >
            <option value="">Selecione...</option>
            {cessionarios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Valor total (R$)" required error={e.valor_total}>
          <Input
            name="valor_total"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={cessao?.valor_total ?? ""}
            placeholder="100000.00"
            required
            disabled={isEdit}
          />
        </Field>
        <Field
          label="Quantidade de parcelas"
          required
          error={e.parcelas_total}
          hint="Serão geradas automaticamente"
        >
          <Input
            name="parcelas_total"
            type="number"
            min="1"
            max="360"
            defaultValue={cessao?.parcelas_total ?? 12}
            required
            disabled={isEdit}
          />
        </Field>

        <Field label="Data da cessão" required error={e.data_cessao}>
          <Input
            name="data_cessao"
            type="date"
            defaultValue={cessao?.data_cessao ?? hojeISO()}
            required
            disabled={isEdit}
          />
        </Field>
        <Field
          label="Vencimento da 1ª parcela"
          required
          error={e.data_vencimento_inicial}
        >
          <Input
            name="data_vencimento_inicial"
            type="date"
            defaultValue={cessao?.data_vencimento_inicial ?? ""}
            required
            disabled={isEdit}
          />
        </Field>
      </section>

      <Field label="Observações">
        <Textarea
          name="observacoes"
          defaultValue={cessao?.observacoes ?? ""}
          placeholder="Detalhes do contrato, condições especiais..."
          rows={3}
        />
      </Field>

      <div className="flex items-center gap-3 pt-4">
        <Submit isEdit={isEdit} />
        <Link
          href="/dashboard/cessoes"
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
      {pending
        ? "Salvando..."
        : isEdit
          ? "Salvar alterações"
          : "Cadastrar cessão e gerar parcelas"}
    </Button>
  );
}
