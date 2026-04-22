"use client";

import { useTransition } from "react";
import { toast } from "sonner";

interface Props {
  /** Nome/identificação do item pra aparecer no confirm dialog. */
  nome: string;
  /** Rótulo do tipo do item (ex: "cliente", "cessionário"). */
  tipo: string;
  /** Server action que faz o delete. Deve retornar { error: string | null }. */
  onDelete: () => Promise<{ error: string | null }>;
  /** Texto do botão. */
  label?: string;
}

/**
 * Botão "Excluir" com confirmação nativa + feedback toast.
 * Usado em listas (clientes, cessionários etc.) — visualmente discreto,
 * fica em cinza até o hover que vira vermelho.
 */
export function DeleteButton({
  nome,
  tipo,
  onDelete,
  label = "Excluir",
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmacao = confirm(
      `Excluir ${tipo} "${nome}"?\n\nEsta ação não pode ser desfeita.`,
    );
    if (!confirmacao) return;

    startTransition(async () => {
      const res = await onDelete();
      if (res.error) {
        toast.error("Não foi possível excluir", {
          description: res.error,
          duration: 8000,
        });
      } else {
        toast.success(`${tipo[0].toUpperCase() + tipo.slice(1)} excluído.`);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      title={`Excluir ${tipo}`}
    >
      {pending ? "..." : label}
    </button>
  );
}
