"use client";

import {
  BulkActionsTable,
  type BulkAction,
} from "@/components/ui/bulk-actions-table";
import {
  excluirClientesEmMassa,
  ativarClientesEmMassa,
} from "./actions";

interface Props {
  items: { id: string; nome: string }[];
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  rowHrefs?: (string | null | undefined)[];
}

export function ClientesTableBulk({ items, headers, rows, rowHrefs }: Props) {
  const actions: BulkAction[] = [
    {
      label: "Ativar",
      tone: "neutral",
      onExecute: (ids) => ativarClientesEmMassa(ids, true),
      successMessage: (ok) =>
        `${ok} cliente${ok === 1 ? "" : "s"} ativado${ok === 1 ? "" : "s"}`,
    },
    {
      label: "Desativar",
      tone: "neutral",
      onExecute: (ids) => ativarClientesEmMassa(ids, false),
      successMessage: (ok) =>
        `${ok} cliente${ok === 1 ? "" : "s"} desativado${ok === 1 ? "" : "s"}`,
    },
    {
      label: "Excluir",
      tone: "danger",
      confirm: (n) =>
        `Excluir ${n} cliente${n === 1 ? "" : "s"}?\n\nClientes com cessões vinculadas serão pulados. Esta ação não pode ser desfeita.`,
      onExecute: excluirClientesEmMassa,
      successMessage: (ok) =>
        `${ok} cliente${ok === 1 ? "" : "s"} excluído${ok === 1 ? "" : "s"}`,
    },
  ];

  return (
    <BulkActionsTable
      items={items}
      headers={headers}
      rows={rows}
      rowHrefs={rowHrefs}
      emptyTipo="clientes"
      actions={actions}
    />
  );
}
