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
        className={`flex items-center gap-1 text-sm transition-colors ${
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
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {ativo && (
        <div
          aria-hidden
          className="absolute -bottom-[19px] left-0 right-0 h-0.5 rounded-full bg-[var(--gold)]"
        />
      )}

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
                  className={`flex items-start gap-3 rounded-md px-3 py-2 transition-colors ${
                    itemActive
                      ? "bg-[var(--gold)]/10 text-[var(--gold)]"
                      : "text-foreground hover:bg-black/30"
                  }`}
                >
                  {item.icon && (
                    <span className="mt-0.5 text-[var(--muted)]">
                      {item.icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.descricao && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
