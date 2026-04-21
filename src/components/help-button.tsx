import Link from "next/link";

/**
 * Botão de ajuda no header — leva pra /dashboard/ajuda.
 * Estilo consistente com ThemeToggle e NotificationsBell.
 */
export function HelpButton() {
  return (
    <Link
      href="/dashboard/ajuda"
      aria-label="Ajuda — como usar o sistema"
      title="Ajuda"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-elevated)] text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
    >
      ?
    </Link>
  );
}
