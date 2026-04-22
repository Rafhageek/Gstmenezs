"use client";

import { DeleteButton } from "@/components/delete-button";
import { excluirCessionario } from "./actions";

export function DeleteCessionarioButton({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  return (
    <DeleteButton
      nome={nome}
      tipo="cessionário"
      onDelete={() => excluirCessionario(id)}
    />
  );
}
