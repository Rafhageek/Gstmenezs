"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Props {
  placeholder?: string;
  paramName?: string;
}

/**
 * Input de busca client-side que sincroniza o termo com a query
 * string da URL (?q=termo). Usa debounce de 300ms para evitar
 * navegação em cada tecla. Server Components leem `q` e filtram.
 */
export function SearchInput({
  placeholder = "Buscar...",
  paramName = "q",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [valor, setValor] = useState(searchParams.get(paramName) ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor) params.set(paramName, valor);
      else params.delete(paramName);
      const novaQs = params.toString();
      const target = novaQs ? `${pathname}?${novaQs}` : pathname;
      startTransition(() => router.replace(target));
    }, 300);
    return () => clearTimeout(t);
  }, [valor, paramName, pathname, router, searchParams]);

  return (
    <div className="relative w-full max-w-sm">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
      >
        ⌕
      </span>
      <input
        type="search"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-black/30 pl-9 pr-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
      />
    </div>
  );
}
