import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/feedback";
import { ImportadorPlanilha } from "./importador-planilha";
import type { ClientePrincipal } from "@/types/database";

export const metadata = {
  title: "Importar planilha histórica — Painel Financeiro",
};

export default async function ImportarPlanilhaPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes_principais")
    .select("id, nome, documento")
    .eq("ativo", true)
    .order("nome")
    .returns<Pick<ClientePrincipal, "id" | "nome" | "documento">[]>();

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Importar planilha histórica"
        descricao="Migre os HTMLs exportados da planilha do contador pra dentro do painel. Cada arquivo = 1 cessionário com seus pagamentos."
      />

      <Alert variant="info">
        <strong>Como funciona:</strong> selecione o cliente cedente, envie os
        arquivos HTML (um por cessionário), revise o preview e confirme. O
        sistema cria os cessionários, as cessões e todos os pagamentos de uma
        vez.
        <br />
        <strong>Cessionários sem CPF/CNPJ</strong> recebem um documento
        placeholder (ex: <code className="font-mono">PENDENTE-001</code>) —
        depois é só editar cada um pra atualizar.
        <br />
        <strong>Arquivos ignorados automaticamente:</strong> Resumo Geral, MOV
        mes atual, e qualquer um sem pagamentos no histórico.
      </Alert>

      <div className="mt-6">
        <ImportadorPlanilha clientes={clientes ?? []} />
      </div>
    </div>
  );
}
