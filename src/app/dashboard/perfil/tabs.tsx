"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/perfil", label: "Dados pessoais", exact: true },
  { href: "/dashboard/perfil/conta", label: "E-mail e senha" },
  { href: "/dashboard/perfil/biometria", label: "Biometria" },
];

export function PerfilTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-[var(--border)] pb-0">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`group relative -mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active
                ? "border-[var(--gold)] text-foreground"
                : "border-transparent text-[var(--muted)] hover:text-foreground"
            }`}
          >
            {tab.label}
            {!active && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 -bottom-[2px] h-0.5 rounded-full bg-[var(--gold)]/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
