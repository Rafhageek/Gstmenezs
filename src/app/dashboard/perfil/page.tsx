import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DadosPerfilForm } from "./dados-form";
import type { Profile } from "@/types/database";

export const metadata = {
  title: "Meu perfil — Painel MNZ",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  return (
    <div>
      <PageHeader
        eyebrow="Meu perfil"
        titulo="Dados pessoais"
        descricao="Seus dados de identificação. Aparecem na tela de boas-vindas e nos logs de auditoria."
      />
      <DadosPerfilForm profile={profile!} />
    </div>
  );
}
