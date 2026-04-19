import { forwardRef } from "react";

const baseInput =
  "w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] disabled:opacity-60";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
        {required && <span className="ml-1 text-[var(--danger)]">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[var(--muted)]/70">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`${baseInput} ${className}`} {...rest} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${baseInput} resize-y ${className}`}
      {...rest}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={`${baseInput} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
});
