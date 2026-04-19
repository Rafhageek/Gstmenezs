"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

interface Props {
  label: string;
  column: string;
}

/**
 * Cabeçalho de coluna clicável para ordenação via query string
 * (?sort=col&dir=asc|desc). Server Component pai lê os params.
 */
export function SortableHeader({ label, column }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSort = searchParams.get("sort");
  const currentDir = searchParams.get("dir") ?? "asc";
  const active = currentSort === column;

  function onClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", column);
    params.set("dir", active && currentDir === "asc" ? "desc" : "asc");
    params.delete("page"); // reseta paginação ao ordenar
    startTransition(() => router.replace(`${pathname}?${params}`));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
        active ? "text-[var(--gold)]" : ""
      }`}
    >
      <span>{label}</span>
      <span aria-hidden className="text-[10px]">
        {active ? (currentDir === "asc" ? "▲" : "▼") : "◇"}
      </span>
    </button>
  );
}
