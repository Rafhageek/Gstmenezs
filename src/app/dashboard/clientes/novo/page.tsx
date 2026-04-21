import { PageHeader } from "@/components/ui/page-header";
import { ClienteForm } from "../cliente-form";

export const metadata = {
  title: "Novo cliente — Painel Financeiro",
};

export default function NovoClientePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Clientes"
        titulo="Novo cliente principal"
        descricao="Cadastre um novo cedente do crédito."
      />
      <ClienteForm />
    </div>
  );
}
