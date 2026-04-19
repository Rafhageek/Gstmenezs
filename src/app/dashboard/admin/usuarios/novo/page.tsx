import { PageHeader } from "@/components/ui/page-header";
import { NovoUsuarioForm } from "./novo-usuario-form";

export const metadata = {
  title: "Novo usuário — Painel MNZ",
};

export default function NovoUsuarioPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Novo usuário"
        descricao="Cadastre um novo usuário do sistema. O e-mail já será confirmado automaticamente."
      />
      <NovoUsuarioForm />
    </div>
  );
}
