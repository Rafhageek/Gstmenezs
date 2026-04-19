"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavDropdownItem {
  href: string;
  label: string;
  descricao?: string;
  icon?: React.ReactNode;
}

interface Props {
  label: string;
  items: NavDropdownItem[];
}

export function NavDropdown({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const ativo = items.some(
    (it) => pathname === it.href || pathname.startsWith(it.href + "/"),
  );

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("click", onClickAway);
      document.addEventListener("keydown", onEsc);
      return () => {
        document.removeEventListener("click", onClickAway);
        document.removeEventListener("keydown", onEsc);
      };
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`group flex items-center gap-1 text-sm transition-colors duration-200 ${
          ativo || open
            ? "text-foreground"
            : "text-[var(--muted)] hover:text-foreground"
        }`}
      >
        <span>{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0.5 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>

        {/* Underline que nasce do centro — ativo permanente; hover cresce. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -bottom-[19px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[var(--gold)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            ativo || open ? "w-full" : "w-0 group-hover:w-full"
          }`}
        />
      </button>

      {open && (
        <div className="animate-fade-in-up absolute left-0 top-full z-40 mt-4 min-w-[220px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl shadow-black/50">
          <nav className="p-1">
            {items.map((item) => {
              const itemActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`group/item flex items-start gap-3 rounded-md px-3 py-2 transition-all duration-200 ${
                    itemActive
                      ? "bg-[var(--gold)]/10 text-[var(--gold)]"
                      : "text-foreground hover:bg-black/30 hover:pl-4"
                  }`}
                >
                  {item.icon && (
                    <span className="mt-0.5 text-[var(--muted)] transition-colors group-hover/item:text-[var(--gold)]">
                      {item.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.descricao && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                  {/* Seta que aparece no hover (só para não-ativos) */}
                  {!itemActive && (
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 text-[var(--muted)] opacity-0 transition-all duration-200 group-hover/item:translate-x-1 group-hover/item:text-[var(--gold)] group-hover/item:opacity-100"
                    >
                      →
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
