"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "./empty-state";
import { ConfirmExclusaoModal } from "../confirm-exclusao-modal";

export interface BulkResultShape {
  ok: number;
  falhas: { id: string; nome?: string; motivo: string }[];
}

export interface BulkAction {
  /** Texto do botão. */
  label: string;
  /** Ícone opcional (ReactNode pequeno). */
  icon?: React.ReactNode;
  /** Tom visual: gold (primário), danger (vermelho), neutral (secundário). */
  tone?: "gold" | "danger" | "neutral";
  /** Mensagem de confirmação (ex: "Excluir 3 clientes?"). Se omitido, não pede. */
  confirm?: (count: number) => string;
  /** Executa a ação. Deve retornar { ok, falhas }. */
  onExecute: (ids: string[]) => Promise<BulkResultShape>;
  /** Mensagem de sucesso (ex: "X clientes excluídos"). */
  successMessage?: (ok: number) => string;
}

interface Props {
  /** Items na ordem das linhas — precisa ter ao menos `id` e `nome`. */
  items: { id: string; nome: string }[];
  headers: React.ReactNode[];
  /** Paralelo a `items`. Cada linha tem N células. */
  rows: React.ReactNode[][];
  /** Href por linha (opcional). Linha clicável exceto em inputs/botões/links. */
  rowHrefs?: (string | null | undefined)[];
  /** Tipo do empty state. */
  emptyTipo?: Parameters<typeof EmptyState>[0]["tipo"];
  /** Ações em lote disponíveis (mostradas na barra flutuante). */
  actions: BulkAction[];
}

/**
 * Tabela com seleção múltipla e barra flutuante de ações em lote.
 * Checkbox por linha + "selecionar todos" no header.
 * Barra aparece fixa no topo quando há ao menos 1 item selecionado.
 */
export function BulkActionsTable({
  items,
  headers,
  rows,
  rowHrefs,
  emptyTipo = "generic",
  actions,
}: Props) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [modalAction, setModalAction] = useState<BulkAction | null>(null);

  const todosSelecionados = useMemo(
    () => items.length > 0 && selecionados.size === items.length,
    [items.length, selecionados.size],
  );
  const algunsSelecionados = selecionados.size > 0 && !todosSelecionados;

  if (items.length === 0) {
    return <EmptyState tipo={emptyTipo} />;
  }

  function toggleTodos() {
    if (todosSelecionados) setSelecionados(new Set());
    else setSelecionados(new Set(items.map((i) => i.id)));
  }

  function toggleUm(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function rodarAcao(action: BulkAction): Promise<void> {
    const ids = [...selecionados];
    if (ids.length === 0) return;
    return new Promise((resolve) => {
      startTransition(async () => {
        const res = await action.onExecute(ids);
        if (res.ok > 0) {
          const msg = action.successMessage
            ? action.successMessage(res.ok)
            : `${res.ok} item${res.ok === 1 ? "" : "s"} processado${res.ok === 1 ? "" : "s"}`;
          toast.success(msg);
        }
        if (res.falhas.length > 0) {
          const primeiros = res.falhas.slice(0, 3).map((f) => {
            const nome = f.nome ? `"${f.nome}"` : f.id.slice(0, 8);
            return `• ${nome}: ${f.motivo}`;
          });
          const restante =
            res.falhas.length > 3
              ? `\n…e mais ${res.falhas.length - 3}`
              : "";
          toast.error(
            `${res.falhas.length} ${res.falhas.length === 1 ? "falhou" : "falharam"}`,
            {
              description: primeiros.join("\n") + restante,
              duration: 10000,
            },
          );
        }
        setSelecionados(new Set());
        setModalAction(null);
        router.refresh();
        resolve();
      });
    });
  }

  function executar(action: BulkAction) {
    const ids = [...selecionados];
    if (ids.length === 0) return;

    // Ações destrutivas (danger) exigem senha via modal
    if (action.tone === "danger") {
      setModalAction(action);
      return;
    }

    // Ações não-destrutivas usam confirm nativo se `confirm` estiver presente
    if (action.confirm) {
      const ok = confirm(action.confirm(ids.length));
      if (!ok) return;
    }

    rodarAcao(action);
  }

  function handleRowClick(
    e: React.MouseEvent<HTMLTableRowElement>,
    href: string | null | undefined,
  ) {
    if (!href) return;
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, select, textarea, label")) return;
    router.push(href);
  }

  const toneClasses: Record<NonNullable<BulkAction["tone"]>, string> = {
    gold: "bg-[var(--gold)] text-[var(--background)] hover:bg-[var(--gold-hover)]",
    danger:
      "border border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20",
    neutral:
      "border border-[var(--border)] bg-black/20 text-foreground hover:border-[var(--gold)]/60",
  };

  return (
    <>
      {/* Barra flutuante de ações (aparece quando tem seleção) */}
      {selecionados.size > 0 && (
        <div className="animate-fade-in-up sticky top-20 z-30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gold)]/40 bg-[var(--background-elevated)]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gold)]/20 text-xs font-semibold text-[var(--gold)]">
              {selecionados.size}
            </span>
            <span className="text-sm">
              <strong>
                {selecionados.size} selecionado
                {selecionados.size === 1 ? "" : "s"}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setSelecionados(new Set())}
              className="text-xs text-[var(--muted)] hover:text-[var(--gold)] hover:underline"
            >
              × limpar seleção
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => executar(a)}
                disabled={pending}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses[a.tone ?? "gold"]}`}
              >
                {a.icon}
                {pending ? "..." : a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={todosSelecionados}
                  ref={(el) => {
                    if (el) el.indeterminate = algunsSelecionados;
                  }}
                  onChange={toggleTodos}
                  className="h-4 w-4 cursor-pointer rounded border-[var(--border)] bg-black/30 accent-[var(--gold)]"
                />
              </th>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const item = items[i];
              if (!item) return null;
              const isSelected = selecionados.has(item.id);
              const href = rowHrefs?.[i] ?? null;
              const isClickable = Boolean(href);
              return (
                <tr
                  key={item.id}
                  onClick={
                    isClickable
                      ? (e) => handleRowClick(e, href)
                      : undefined
                  }
                  className={`border-t border-[var(--border)] transition-colors ${
                    isSelected
                      ? "bg-[var(--gold)]/[0.08]"
                      : i % 2 === 1
                        ? "bg-black/[0.08]"
                        : ""
                  } hover:bg-[var(--gold)]/[0.06] ${isClickable ? "cursor-pointer" : ""}`}
                >
                  <td className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${item.nome}`}
                      checked={isSelected}
                      onChange={() => toggleUm(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 cursor-pointer rounded border-[var(--border)] bg-black/30 accent-[var(--gold)]"
                    />
                  </td>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 align-middle">
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalAction && (
        <ConfirmExclusaoModal
          titulo={modalAction.label}
          descricao={
            modalAction.confirm
              ? modalAction.confirm(selecionados.size)
              : `Confirmar "${modalAction.label}" em ${selecionados.size} item(ns)?`
          }
          labelConfirmar={modalAction.label}
          onConfirmar={() => rodarAcao(modalAction)}
          onCancelar={() => setModalAction(null)}
        />
      )}
    </>
  );
}
