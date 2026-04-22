"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmExclusaoModal } from "./confirm-exclusao-modal";

interface Props {
  /** Nome/identificação do item pra aparecer no modal. */
  nome: string;
  /** Rótulo do tipo do item (ex: "cliente", "cessionário"). */
  tipo: string;
  /** Server action que faz o delete. Deve retornar { error: string | null }. */
  onDelete: () => Promise<{ error: string | null }>;
  /** Texto do botão. */
  label?: string;
}

/**
 * Botão "Excluir" com modal de dupla confirmação (senha do usuário).
 * Usado em listas (clientes, cessionários etc.) — visualmente discreto,
 * fica em cinza até o hover que vira vermelho.
 */
export function DeleteButton({
  nome,
  tipo,
  onDelete,
  label = "Excluir",
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function executarExclusao() {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await onDelete();
        if (res.error) {
          toast.error("Não foi possível excluir", {
            description: res.error,
            duration: 8000,
          });
        } else {
          toast.success(`${tipo[0].toUpperCase() + tipo.slice(1)} excluído.`);
          setModalOpen(false);
        }
        resolve();
      });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={pending}
        className="text-xs text-[var(--muted)] transition-colors hover:text-[var(--danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        title={`Excluir ${tipo}`}
      >
        {pending ? "..." : label}
      </button>

      {modalOpen && (
        <ConfirmExclusaoModal
          titulo={`Excluir ${tipo}`}
          descricao={
            <>
              Tem certeza que deseja excluir{" "}
              <strong className="text-foreground">{tipo} &ldquo;{nome}&rdquo;</strong>
              ? Esta ação não pode ser desfeita.
            </>
          }
          onConfirmar={executarExclusao}
          onCancelar={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
