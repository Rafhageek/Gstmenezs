"use client";

import {
  BulkActionsTable,
  type BulkAction,
} from "@/components/ui/bulk-actions-table";
import {
  excluirCessionariosEmMassa,
  ativarCessionariosEmMassa,
} from "./actions";

interface Props {
  items: { id: string; nome: string }[];
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  rowHrefs?: (string | null | undefined)[];
}

export function CessionariosTableBulk({
  items,
  headers,
  rows,
  rowHrefs,
}: Props) {
  const actions: BulkAction[] = [
    {
      label: "Ativar",
      tone: "neutral",
      onExecute: (ids) => ativarCessionariosEmMassa(ids, true),
      successMessage: (ok) =>
        `${ok} cessionário${ok === 1 ? "" : "s"} ativado${ok === 1 ? "" : "s"}`,
    },
    {
      label: "Desativar",
      tone: "neutral",
      onExecute: (ids) => ativarCessionariosEmMassa(ids, false),
      successMessage: (ok) =>
        `${ok} cessionário${ok === 1 ? "" : "s"} desativado${ok === 1 ? "" : "s"}`,
    },
    {
      label: "Excluir",
      tone: "danger",
      confirm: (n) =>
        `Excluir ${n} cessionário${n === 1 ? "" : "s"}?\n\nCessionários com cessões vinculadas serão pulados. Esta ação não pode ser desfeita.`,
      onExecute: excluirCessionariosEmMassa,
      successMessage: (ok) =>
        `${ok} cessionário${ok === 1 ? "" : "s"} excluído${ok === 1 ? "" : "s"}`,
    },
  ];

  return (
    <BulkActionsTable
      items={items}
      headers={headers}
      rows={rows}
      rowHrefs={rowHrefs}
      emptyTipo="cessionarios"
      actions={actions}
    />
  );
}
