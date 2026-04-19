export function Alert({
  variant = "info",
  children,
}: {
  variant?: "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    info: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]",
    success:
      "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]",
    warning:
      "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]",
    danger:
      "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]",
  } as const;
  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 text-sm ${map[variant]}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: "neutral" | "gold" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    neutral: "border-[var(--border)] bg-black/30 text-[var(--muted)]",
    gold: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]",
    success:
      "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]",
    warning:
      "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]",
    danger:
      "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]",
  } as const;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${map[variant]}`}
    >
      {children}
    </span>
  );
}
