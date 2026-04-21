import { PageHeader } from "@/components/ui/page-header";
import { CessionarioForm } from "../cessionario-form";

export const metadata = {
  title: "Novo cessionário — Painel Financeiro",
};

export default function NovoCessionarioPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Clientes · Cessionários"
        titulo="Novo cessionário"
        descricao="Cadastre um novo recebedor de cessão de crédito."
      />
      <CessionarioForm />
    </div>
  );
}
