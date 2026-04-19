"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  children: React.ReactNode;
  /** Match exato (padrão). Se false, ativo também para subrotas. */
  exact?: boolean;
}

export function NavLink({ href, children, exact = false }: Props) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`group relative text-sm transition-colors duration-200 ${
        active
          ? "text-foreground"
          : "text-[var(--muted)] hover:text-foreground"
      }`}
    >
      {children}
      {/*
        Underline que nasce do centro e se abre para os lados.
        - Ativo: largura 100% permanente.
        - Hover (não ativo): cresce de 0 a 100% em 280ms.
      */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -bottom-[19px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[var(--gold)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}
