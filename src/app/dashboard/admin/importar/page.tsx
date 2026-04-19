import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/feedback";
import { ImportWizard } from "./wizard";

export const metadata = {
  title: "Importar CSV — Painel MNZ",
};

export default function ImportarPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Importar cessões em lote (CSV)"
        descricao="Migre cessões de planilhas antigas. O sistema cria automaticamente os clientes/cessionários novos e gera todas as parcelas."
      />

      <Alert variant="info">
        <strong>Template esperado:</strong> CSV com cabeçalho na primeira
        linha. Colunas obrigatórias:{" "}
        <code className="font-mono text-xs">
          numero_contrato, cliente_nome, cliente_documento, cessionario_nome,
          cessionario_documento, valor_total, parcelas_total, data_cessao,
          data_vencimento_inicial
        </code>
        . Opcionais:{" "}
        <code className="font-mono text-xs">
          percentual_cedido, observacoes
        </code>
        .
        <br />
        <a
          href="/templates/cessoes.csv"
          download
          className="mt-2 inline-block text-[var(--gold)] hover:underline"
        >
          ⬇ Baixar template
        </a>
      </Alert>

      <div className="mt-6">
        <ImportWizard />
      </div>
    </div>
  );
}
