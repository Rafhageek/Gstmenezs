"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type AuthFormState } from "./actions";

const initial: AuthFormState = { error: null };

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState(action, initial);

  return (
    <div className="mt-6">
      <div className="mb-6 flex rounded-lg bg-black/30 p-1">
        <Tab active={mode === "signin"} onClick={() => setMode("signin")}>
          Entrar
        </Tab>
        <Tab active={mode === "signup"} onClick={() => setMode("signup")}>
          Criar conta
        </Tab>
      </div>

      <form action={formAction} className="space-y-4">
        {mode === "signup" && (
          <Field
            label="Nome completo"
            name="nome"
            type="text"
            placeholder="Dr(a). Nome Sobrenome"
            required
          />
        )}
        <Field
          label="E-mail"
          name="email"
          type="email"
          placeholder="advogado@menezes.adv.br"
          required
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          placeholder="••••••••"
          minLength={mode === "signup" ? 8 : undefined}
          required
        />

        {state.error && (
          <p
            role="alert"
            className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]"
          >
            {state.error}
          </p>
        )}

        <SubmitButton mode={mode} />
      </form>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--background-elevated)] text-foreground shadow"
          : "text-[var(--muted)] hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      <input
        {...inputProps}
        className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
      />
    </label>
  );
}

function SubmitButton({ mode }: { mode: "signin" | "signup" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Aguarde..."
        : mode === "signin"
          ? "Entrar no painel"
          : "Criar minha conta"}
    </button>
  );
}
