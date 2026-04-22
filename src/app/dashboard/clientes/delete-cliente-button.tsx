"use client";

import { DeleteButton } from "@/components/delete-button";
import { excluirCliente } from "./actions";

export function DeleteClienteButton({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  return (
    <DeleteButton
      nome={nome}
      tipo="cliente"
      onDelete={() => excluirCliente(id)}
    />
  );
}
