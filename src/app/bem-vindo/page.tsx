import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConfiguracoes } from "@/lib/configuracoes";
import { BrandLogo } from "@/components/brand-logo";
import type { Profile } from "@/types/database";
import { WelcomeSplash } from "./welcome";

export const metadata = {
  title: "Bem-vindo — Painel MNZ",
};

export default async function BemVindoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", user.id)
    .single<Pick<Profile, "nome" | "role">>();

  const config = await getConfiguracoes();

  const nome = profile?.nome ?? user.email?.split("@")[0] ?? "Usuário";
  const saudacao = montarSaudacao();
  const tratamento = profile?.role === "admin" || /dr\.?\s/i.test(nome)
    ? "Dr(a)."
    : "";

  return (
    <WelcomeSplash
      nome={nome}
      tratamento={tratamento}
      saudacao={saudacao}
      escritorio={config.razao_social}
      logo={<BrandLogo size={72} />}
    />
  );
}

function montarSaudacao(): string {
  const hora = new Date().toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  });
  const h = Number(hora);
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
