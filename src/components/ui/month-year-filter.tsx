"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { StyledSelect } from "./styled-select";

interface Props {
  paramMes?: string;
  paramAno?: string;
  label?: string;
  /** Anos disponiveis no dropdown. Se vazio, gera automatico (ano atual - 5 ... +2). */
  anos?: number[];
}

const MESES_OPTS = [
  { value: "", label: "Todos os meses" },
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

/**
 * Filtro de mes + ano (dropdowns independentes).
 * Query params: ?mes=1..12 & ?ano=YYYY
 */
export function MonthYearFilter({
  paramMes = "mes",
  paramAno = "ano",
  label = "Período",
  anos,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const mes = searchParams.get(paramMes) ?? "";
  const ano = searchParams.get(paramAno) ?? "";

  const anoAtual = new Date().getFullYear();
  const listaAnos =
    anos && anos.length > 0
      ? anos
      : Array.from({ length: 8 }, (_, i) => anoAtual - 5 + i);

  function atualizar(chave: "mes" | "ano", valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    const pkey = chave === "mes" ? paramMes : paramAno;
    if (valor) params.set(pkey, valor);
    else params.delete(pkey);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function limpar() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramMes);
    params.delete(paramAno);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const hasFilter = mes || ano;

  const anosOpts = [
    { value: "", label: "Todos os anos" },
    ...listaAnos.map((a) => ({ value: String(a), label: String(a) })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[var(--muted)]">{label}:</span>
      <StyledSelect
        value={mes}
        onChange={(v) => atualizar("mes", v)}
        options={MESES_OPTS}
        placeholder="Mês"
        ariaLabel="Filtrar por mês"
        widthClass="w-36"
      />
      <StyledSelect
        value={ano}
        onChange={(v) => atualizar("ano", v)}
        options={anosOpts}
        placeholder="Ano"
        ariaLabel="Filtrar por ano"
        widthClass="w-32"
      />
      {hasFilter && (
        <button
          type="button"
          onClick={limpar}
          className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--gold)] hover:underline"
        >
          × limpar
        </button>
      )}
    </div>
  );
}
