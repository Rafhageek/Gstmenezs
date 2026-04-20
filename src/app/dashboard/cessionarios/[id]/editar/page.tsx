import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { CessionarioForm } from "../../cessionario-form";
import type { Cessionario } from "@/types/database";

export const metadata = {
  title: "Editar cessionário — Painel MNZ",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarCessionarioPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cessionario } = await supabase
    .from("cessionarios")
    .select("*")
    .eq("id", id)
    .single<Cessionario>();

  if (!cessionario) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Clientes · Cessionários"
        titulo={`Editar: ${cessionario.nome}`}
        descricao="Atualize os dados do cessionário."
      />
      <CessionarioForm cessionario={cessionario} />
    </div>
  );
}
