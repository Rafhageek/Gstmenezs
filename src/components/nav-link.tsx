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
      className={`relative text-sm transition-colors ${
        active
          ? "text-foreground"
          : "text-[var(--muted)] hover:text-foreground"
      }`}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute -bottom-[19px] left-0 right-0 h-0.5 rounded-full bg-[var(--gold)]"
        />
      )}
    </Link>
  );
}
