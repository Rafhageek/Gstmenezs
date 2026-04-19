"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UserRole } from "@/types/database";

interface Props {
  nome: string;
  email: string;
  role: UserRole | undefined;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  financeiro: "Financeiro",
  contador: "Contador",
};

export function UserMenu({ nome, email, role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu do usuário"
        className={`flex h-9 items-center gap-2 rounded-lg border px-1.5 py-1 text-xs transition-colors ${
          open
            ? "border-[var(--gold)] bg-[var(--gold)]/10"
            : "border-[var(--border)] hover:border-[var(--gold)]"
        }`}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--gold)]/60 bg-[var(--gold)]/15 font-mono text-xs font-bold text-[var(--gold)]"
          aria-hidden
        >
          {iniciais}
        </span>
        <span className="hidden md:flex flex-col items-start leading-tight">
          <span className="max-w-[140px] truncate text-sm font-medium text-foreground">
            {nome.split(" ").slice(0, 2).join(" ")}
          </span>
          {role && (
            <span className="text-[9px] uppercase tracking-wider text-[var(--gold)]">
              {ROLE_LABEL[role]}
            </span>
          )}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`hidden md:block text-[var(--muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="animate-fade-in-up absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl shadow-black/50">
          <header className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--gold)]/60 bg-[var(--gold)]/15 font-mono text-sm font-bold text-[var(--gold)]">
                {iniciais}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{nome}</p>
                <p className="truncate text-[11px] text-[var(--muted)]">
                  {email}
                </p>
                {role && (
                  <span className="mt-1 inline-block rounded bg-[var(--gold)]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                    {ROLE_LABEL[role]}
                  </span>
                )}
              </div>
            </div>
          </header>

          <nav className="p-1">
            <MenuLink
              href="/dashboard/perfil/biometria"
              icon={<LockIcon />}
              label="Biometria"
              onClick={() => setOpen(false)}
            />
            {role === "admin" && (
              <>
                <Divider />
                <MenuLink
                  href="/dashboard/admin/usuarios"
                  icon={<UsersIcon />}
                  label="Usuários"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/dashboard/admin/portal"
                  icon={<LinkIcon />}
                  label="Portal do contador"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/dashboard/admin/importar"
                  icon={<UploadIcon />}
                  label="Importar CSV"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/dashboard/admin/logs"
                  icon={<FileIcon />}
                  label="Logs de auditoria"
                  onClick={() => setOpen(false)}
                />
                <MenuLink
                  href="/dashboard/admin/configuracoes"
                  icon={<SettingsIcon />}
                  label="Configurações"
                  onClick={() => setOpen(false)}
                />
              </>
            )}
          </nav>

          <form
            action="/auth/sign-out"
            method="post"
            className="border-t border-[var(--border)] p-1"
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10"
            >
              <LogoutIcon />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-black/30"
    >
      <span className="text-[var(--muted)]">{icon}</span>
      {label}
    </Link>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-[var(--border)]/60" />;
}

/* ============================================================
 * Ícones
 * ============================================================ */

const iconSize = { width: 14, height: 14 };

function LockIcon() {
  return (
    <svg
      {...iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      {...iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      {...iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      {...iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      {...iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      {...iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      {...iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
