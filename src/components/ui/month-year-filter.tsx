"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

interface Props {
  paramMes?: string;
  paramAno?: string;
  label?: string;
  /** Anos disponiveis no dropdown. Se vazio, gera automatico (ano atual - 5 ... +2). */
  anos?: number[];
}

const MESES = [
  { v: "1", n: "Janeiro" },
  { v: "2", n: "Fevereiro" },
  { v: "3", n: "Março" },
  { v: "4", n: "Abril" },
  { v: "5", n: "Maio" },
  { v: "6", n: "Junho" },
  { v: "7", n: "Julho" },
  { v: "8", n: "Agosto" },
  { v: "9", n: "Setembro" },
  { v: "10", n: "Outubro" },
  { v: "11", n: "Novembro" },
  { v: "12", n: "Dezembro" },
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[var(--muted)]">{label}:</span>
      <select
        value={mes}
        onChange={(e) => atualizar("mes", e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-black/30 px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
      >
        <option value="">Mês</option>
        {MESES.map((m) => (
          <option key={m.v} value={m.v}>
            {m.n}
          </option>
        ))}
      </select>
      <select
        value={ano}
        onChange={(e) => atualizar("ano", e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-black/30 px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
      >
        <option value="">Ano</option>
        {listaAnos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      {hasFilter && (
        <button
          type="button"
          onClick={limpar}
          className="text-xs text-[var(--muted)] hover:text-[var(--gold)] hover:underline"
        >
          × limpar
        </button>
      )}
    </div>
  );
}
