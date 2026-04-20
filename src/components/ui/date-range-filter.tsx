"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

interface Props {
  paramDe?: string;
  paramAte?: string;
  labelDe?: string;
  labelAte?: string;
}

/**
 * Filtro de intervalo de datas sincronizado com query string.
 * Query params: ?de=YYYY-MM-DD&ate=YYYY-MM-DD
 */
export function DateRangeFilter({
  paramDe = "de",
  paramAte = "ate",
  labelDe = "De",
  labelAte = "Até",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const de = searchParams.get(paramDe) ?? "";
  const ate = searchParams.get(paramAte) ?? "";

  function atualizar(qual: "de" | "ate", valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    const chave = qual === "de" ? paramDe : paramAte;
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function limpar() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramDe);
    params.delete(paramAte);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const hasFilter = de || ate;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span>{labelDe}</span>
        <input
          type="date"
          value={de}
          onChange={(e) => atualizar("de", e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-black/30 px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span>{labelAte}</span>
        <input
          type="date"
          value={ate}
          onChange={(e) => atualizar("ate", e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-black/30 px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
        />
      </label>
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
