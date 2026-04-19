import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--gold)] text-[var(--background)] hover:bg-[var(--gold-hover)]",
  secondary:
    "border border-[var(--border)] bg-[var(--background-elevated)] text-foreground hover:border-[var(--gold)]",
  ghost:
    "text-[var(--muted)] hover:text-foreground hover:bg-black/30",
  danger:
    "bg-[var(--danger)]/15 text-[var(--danger)] hover:bg-[var(--danger)]/25 border border-[var(--danger)]/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className = "", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...rest}
      />
    );
  },
);
