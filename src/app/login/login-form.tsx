"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type AuthFormState } from "./actions";

const initial: AuthFormState = { error: null };
const STORAGE_KEY = "painelmnz:email_lembrado";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="mt-6">
      <div className="animate-fade-in mb-6 flex rounded-lg bg-black/30 p-1">
        <Tab active={mode === "signin"} onClick={() => setMode("signin")}>
          Entrar
        </Tab>
        <Tab active={mode === "signup"} onClick={() => setMode("signup")}>
          Criar conta
        </Tab>
      </div>

      {/* Forms isolados — cada um com seu próprio useActionState.
          Unmount do outro limpa qualquer erro residual. */}
      {mode === "signin" ? <SignInForm /> : <SignUpForm />}
    </div>
  );
}

/* ============================================================
 * Form: Entrar
 * ============================================================ */
function SignInForm() {
  const [state, formAction] = useActionState(signIn, initial);
  const [lembrar, setLembrar] = useState(true);
  const [emailInicial, setEmailInicial] = useState("");

  // Lê localStorage apenas no cliente (SSR-safe) e hidrata o form.
  // setState em effect aqui é intencional — hydration do browser.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmailInicial(saved);
        setLembrar(true);
      } else {
        setLembrar(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    try {
      if (lembrar && email) {
        localStorage.setItem(STORAGE_KEY, email);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Field label="E-mail" icon={<MailIcon />}>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={emailInicial}
          key={emailInicial}
          placeholder="advogado@menezes.adv.br"
          className={inputClass}
        />
      </Field>

      <Field label="Senha" icon={<LockIcon />}>
        <PasswordInput required />
      </Field>

      <div className="flex items-center justify-between text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-[var(--muted)] select-none">
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => setLembrar(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-[var(--border)] bg-black/30 text-[var(--gold)] focus:ring-[var(--gold)]"
          />
          Lembrar meu e-mail
        </label>
        <a
          href="/recuperar-senha"
          className="text-[var(--gold)] hover:underline"
        >
          Esqueci a senha
        </a>
      </div>

      {state.error && <ErrorAlert message={state.error} />}

      <SubmitButton mode="signin" />

      <p className="pt-2 text-center text-[11px] text-[var(--muted)]/70">
        Seu login é protegido por criptografia. Credenciais não são armazenadas
        neste dispositivo — apenas o e-mail (se você escolher).
      </p>
    </form>
  );
}

/* ============================================================
 * Form: Criar conta
 * ============================================================ */
function SignUpForm() {
  const [state, formAction] = useActionState(signUp, initial);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome completo" icon={<UserIcon />}>
        <input
          name="nome"
          type="text"
          required
          placeholder="Dr(a). Nome Sobrenome"
          autoComplete="name"
          className={inputClass}
        />
      </Field>

      <Field label="E-mail" icon={<MailIcon />}>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="advogado@menezes.adv.br"
          className={inputClass}
        />
      </Field>

      <Field label="Senha" icon={<LockIcon />}>
        <PasswordInput required minLength={8} />
      </Field>

      {state.error && (
        <ErrorAlert
          message={state.error}
          variant={
            state.error.startsWith("Conta criada") ? "info" : "danger"
          }
        />
      )}

      <SubmitButton mode="signup" />
    </form>
  );
}

/* ============================================================
 * Shared
 * ============================================================ */

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-black/30 py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-[var(--muted)]/60 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]";

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
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        >
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}

function PasswordInput({
  minLength,
  required,
}: {
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
      >
        <LockIcon />
      </span>
      <input
        name="password"
        type={visible ? "text" : "password"}
        minLength={minLength}
        required={required}
        autoComplete={minLength ? "new-password" : "current-password"}
        placeholder="••••••••"
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted)] transition-colors hover:text-foreground"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function ErrorAlert({
  message,
  variant = "danger",
}: {
  message: string;
  variant?: "danger" | "info";
}) {
  const classes =
    variant === "info"
      ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
      : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]";
  return (
    <p
      role="alert"
      className={`animate-fade-in rounded-md border px-3 py-2 text-sm ${classes}`}
    >
      {message}
    </p>
  );
}

function SubmitButton({ mode }: { mode: "signin" | "signup" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[var(--gold)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] transition-all duration-150 hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-80 ${
        pending ? "cursor-wait" : ""
      }`}
    >
      {pending && (
        <span
          aria-hidden
          className="h-4 w-4 animate-[spin-slow_0.8s_linear_infinite] rounded-full border-2 border-[var(--background)] border-t-transparent"
        />
      )}
      <span>
        {pending
          ? mode === "signin"
            ? "Autenticando..."
            : "Criando conta..."
          : mode === "signin"
            ? "Entrar no painel"
            : "Criar minha conta"}
      </span>
    </button>
  );
}

/* ============================================================
 * Ícones SVG inline
 * ============================================================ */

function iconProps() {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function MailIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
