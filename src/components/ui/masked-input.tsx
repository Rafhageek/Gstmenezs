"use client";

import { IMaskInput } from "react-imask";

const baseClass =
  "w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-60";

interface MaskedProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

/** CPF / CNPJ — escolhe a máscara conforme o tamanho. */
export function DocumentoInput({ defaultValue, ...rest }: MaskedProps) {
  return (
    <IMaskInput
      mask={[
        { mask: "000.000.000-00", maxLength: 11 },
        { mask: "00.000.000/0000-00" },
      ]}
      defaultValue={defaultValue ?? ""}
      placeholder="000.000.000-00"
      className={baseClass}
      {...rest}
    />
  );
}

/** Telefone fixo ou celular. */
export function TelefoneInput({ defaultValue, ...rest }: MaskedProps) {
  return (
    <IMaskInput
      mask={[
        { mask: "(00) 0000-0000", maxLength: 10 },
        { mask: "(00) 00000-0000" },
      ]}
      defaultValue={defaultValue ?? ""}
      placeholder="(11) 99999-9999"
      className={baseClass}
      {...rest}
    />
  );
}

/** CEP brasileiro 00000-000. */
export function CepInput({ defaultValue, ...rest }: MaskedProps) {
  return (
    <IMaskInput
      mask="00000-000"
      defaultValue={defaultValue ?? ""}
      placeholder="00000-000"
      className={baseClass}
      {...rest}
    />
  );
}
