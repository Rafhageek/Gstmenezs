"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmExclusaoModal } from "@/components/confirm-exclusao-modal";
import {
  limparImportacoesCliente,
  type LimpezaPreview,
} from "@/app/dashboard/admin/importar-planilha/actions";

interface Props {
  clienteId: string;
  clienteNome: string;
  preview: LimpezaPreview;
}

/**
 * Botão admin pra zerar todas as cessões importadas de um cliente.
 * Visível só para admins, e só renderiza se houver algo a limpar.
 */
export function LimparImportacoesButton({
  clienteId,
  clienteNome,
  preview,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (preview.cessoes === 0) return null;

  function executar(): Promise<void> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await limparImportacoesCliente(clienteId);
        if (!res.ok) {
          toast.error("Falha na limpeza", {
            description: res.error ?? "Erro desconhecido",
            duration: 8000,
          });
        } else {
          toast.success(
            `Removidas ${res.cessoesRemovidas} cessões, ${res.pagamentosRemovidos} pagamentos e ${res.cessionariosRemovidos} cessionários órfãos.`,
            { duration: 8000 },
          );
          setModalOpen(false);
          router.refresh();
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
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--danger)]/40 bg-transparent px-4 py-2 text-xs font-semibold text-[var(--danger)] transition-all hover:border-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:cursor-not-allowed disabled:opacity-60"
        title="Apaga todas as cessões importadas para re-importar do zero"
      >
        🗑 Limpar importações ({preview.cessoes})
      </button>

      {modalOpen && (
        <ConfirmExclusaoModal
          titulo="Limpar importações deste cliente"
          descricao={
            <>
              Vai apagar permanentemente do cliente{" "}
              <strong className="text-foreground">{clienteNome}</strong>:
              <ul className="mt-2 list-disc pl-5 text-xs">
                <li>
                  <strong>{preview.cessoes}</strong> cessões importadas (com
                  origem &ldquo;[IMPORT]&rdquo;)
                </li>
                <li>
                  <strong>{preview.pagamentos}</strong> pagamentos vinculados
                </li>
                <li>
                  <strong>{preview.cessionariosOrfaos}</strong> cessionários
                  que ficarão sem nenhuma cessão
                </li>
              </ul>
              <p className="mt-3 text-xs text-[var(--warning)]">
                ⚠ Cessões editadas manualmente, comprovantes anexados e
                qualquer dado fora da importação serão perdidos.
              </p>
            </>
          }
          labelConfirmar="Apagar tudo"
          onConfirmar={executar}
          onCancelar={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
