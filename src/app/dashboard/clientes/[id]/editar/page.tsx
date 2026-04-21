import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ClienteForm } from "../../cliente-form";
import type { ClientePrincipal } from "@/types/database";

export const metadata = {
  title: "Editar cliente — Painel Financeiro",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes_principais")
    .select("*")
    .eq("id", id)
    .single<ClientePrincipal>();

  if (!cliente) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Clientes"
        titulo={`Editar: ${cliente.nome}`}
        descricao="Atualize os dados do cliente principal."
      />
      <ClienteForm cliente={cliente} />
    </div>
  );
}
