import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/feedback";
import { ConfigForm } from "./config-form";
import type { Configuracoes } from "@/types/database";

export const metadata = {
  title: "Configurações — Painel MNZ",
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", 1)
    .single<Configuracoes>();

  if (error || !data) {
    return (
      <div>
        <PageHeader
          eyebrow="Administração"
          titulo="Configurações do escritório"
        />
        <Alert variant="warning">
          A tabela de configurações ainda não foi criada. Aplique a migration{" "}
          <code className="font-mono">
            supabase/migrations/0005_config_e_pagamento_parcial.sql
          </code>{" "}
          no Supabase.
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Configurações do escritório"
        descricao="Estes dados aparecem em todos os relatórios PDF gerados pelo sistema."
      />
      <ConfigForm config={data} />
    </div>
  );
}
