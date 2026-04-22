"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { verificarSenhaUsuario } from "@/app/dashboard/auth-actions";

interface Props {
  /** Título do modal (ex: "Excluir cliente"). */
  titulo: string;
  /** Descrição longa (ex: 'Tem certeza que deseja excluir "João"?'). */
  descricao: React.ReactNode;
  /** Texto do botão destrutivo. Padrão: "Confirmar exclusão". */
  labelConfirmar?: string;
  /** Chamado com a senha validada. Deve executar a ação destrutiva. */
  onConfirmar: () => Promise<void> | void;
  /** Fecha o modal sem agir. */
  onCancelar: () => void;
}

/**
 * Modal de dupla confirmação pra ações destrutivas (excluir, cancelar,
 * estornar). Exige senha do usuário logado antes de executar a ação.
 *
 * Fluxo:
 * 1. Usuário digita senha
 * 2. Clica "Confirmar exclusão"
 * 3. Chamada verificarSenhaUsuario() no servidor
 * 4. Se senha OK, onConfirmar() é chamado (que executa a ação de verdade)
 * 5. Se senha errada, mostra erro inline e mantém modal aberto
 */
export function ConfirmExclusaoModal({
  titulo,
  descricao,
  labelConfirmar = "Confirmar exclusão",
  onConfirmar,
  onCancelar,
}: Props) {
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofoco no campo senha ao abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape fecha modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancelar();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancelar, pending]);

  function handleConfirm() {
    setErro(null);
    if (!senha) {
      setErro("Digite sua senha.");
      return;
    }
    startTransition(async () => {
      const res = await verificarSenhaUsuario(senha);
      if (!res.ok) {
        setErro(res.erro ?? "Senha inválida.");
        return;
      }
      await onConfirmar();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleConfirm();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-exclusao-titulo"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => !pending && onCancelar()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        disabled={pending}
      />

      {/* Card */}
      <div className="animate-fade-in-up relative z-10 w-full max-w-md rounded-2xl border border-[var(--danger)]/30 bg-[var(--background-elevated)] p-6 shadow-2xl shadow-black/60">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--danger)]/15 text-[var(--danger)]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-exclusao-titulo"
              className="text-lg font-semibold tracking-tight"
            >
              {titulo}
            </h2>
            <div className="mt-1 text-sm text-[var(--muted)]">{descricao}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="confirm-exclusao-senha"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
            >
              Confirme com sua senha
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="confirm-exclusao-senha"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={pending}
                autoComplete="current-password"
                className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2.5 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-[var(--muted)]/60 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted)] transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {mostrarSenha ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]"
            >
              {erro}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancelar}
              disabled={pending}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--gold)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || !senha}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--danger)]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending && (
                <span
                  aria-hidden
                  className="h-3 w-3 animate-[spin-slow_0.8s_linear_infinite] rounded-full border-2 border-white border-t-transparent"
                />
              )}
              {pending ? "Verificando..." : labelConfirmar}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
