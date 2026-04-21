import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { CessaoForm } from "../../cessao-form";
import type {
  CessaoCredito,
  ClientePrincipal,
  Cessionario,
} from "@/types/database";

export const metadata = {
  title: "Editar cessão — Painel Financeiro",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarCessaoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cessao }, { data: clientes }, { data: cessionarios }] =
    await Promise.all([
      supabase
        .from("cessoes_credito")
        .select("*")
        .eq("id", id)
        .single<CessaoCredito>(),
      supabase
        .from("clientes_principais")
        .select("id, nome, documento")
        .order("nome")
        .returns<Pick<ClientePrincipal, "id" | "nome" | "documento">[]>(),
      supabase
        .from("cessionarios")
        .select("id, nome, documento")
        .order("nome")
        .returns<Pick<Cessionario, "id" | "nome" | "documento">[]>(),
    ]);

  if (!cessao) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        titulo={`Editar contrato ${cessao.numero_contrato}`}
        descricao="Apenas número do contrato, taxa e observações são editáveis."
      />
      <CessaoForm
        cessao={cessao}
        clientes={clientes ?? []}
        cessionarios={cessionarios ?? []}
      />
    </div>
  );
}
