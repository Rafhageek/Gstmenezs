"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  items: NavItem[];
}

export function MobileNav({ items }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-foreground"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          {open ? (
            <path
              d="M6 6L18 18M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <>
              <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
          <nav className="fixed left-0 right-0 top-[64px] z-50 border-b border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl shadow-black/40 md:hidden">
            <ul className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between px-6 py-3 text-sm transition-colors ${
                        active
                          ? "bg-[var(--gold)]/10 text-[var(--gold)]"
                          : "text-foreground hover:bg-black/30"
                      }`}
                    >
                      {item.label}
                      <span className="text-xs text-[var(--muted)]">→</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <form
                  action="/auth/sign-out"
                  method="post"
                  className="px-6 py-3"
                >
                  <button
                    type="submit"
                    className="text-sm text-[var(--danger)]"
                  >
                    Sair
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
