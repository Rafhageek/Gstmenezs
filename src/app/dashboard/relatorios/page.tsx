import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/feedback";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { formatBRL, formatDocumento } from "@/lib/format";
import type {
  CessaoResumo,
  InadimplenciaItem,
  ClientePrincipal,
} from "@/types/database";

export const metadata = {
  title: "Relatórios — Painel Financeiro",
};

export default async function RelatoriosPage() {
  const supabase = await createClient();

  const [cessoesRes, inadRes, clientesRes] = await Promise.all([
    supabase
      .from("v_cessoes_resumo")
      .select("id,numero_contrato,cliente_nome,valor_total,status")
      .order("data_vencimento_inicial", { ascending: true })
      .returns<
        Pick<
          CessaoResumo,
          "id" | "numero_contrato" | "cliente_nome" | "valor_total" | "status"
        >[]
      >(),
    supabase
      .from("v_inadimplencia")
      .select("valor")
      .returns<Pick<InadimplenciaItem, "valor">[]>(),
    supabase
      .from("clientes_principais")
      .select("id,nome,documento")
      .eq("ativo", true)
      .order("nome")
      .returns<Pick<ClientePrincipal, "id" | "nome" | "documento">[]>(),
  ]);
  const clientes = clientesRes.data ?? [];

  const cessoes = cessoesRes.data ?? [];
  const totalInadimplencia = (inadRes.data ?? []).reduce(
    (s, i) => s + Number(i.valor),
    0,
  );
  const qtdInadimplencia = inadRes.data?.length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Relatórios"
        titulo="Catálogo de relatórios"
        descricao="Documentos profissionais com a logomarca Menezes Advocacia, prontos para impressão e envio."
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inadimplência consolidada */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-6">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
                Cobrança
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                Inadimplência consolidada
              </h2>
            </div>
            {qtdInadimplencia > 0 && (
              <Badge variant="danger">
                {qtdInadimplencia} parcela{qtdInadimplencia === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Relação completa de parcelas vencidas e não pagas, agrupada
            por cliente. Inclui dias de atraso e total devido.
          </p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Total em atraso
              </p>
              <p className="mt-1 text-xl font-semibold text-[var(--danger)]">
                {formatBRL(totalInadimplencia)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/api/relatorios/inadimplencia"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)]"
              >
                ⬇ Gerar PDF
              </a>
              <WhatsAppShareButton
                pdfUrl="/api/relatorios/inadimplencia"
                filename={`inadimplencia-${new Date().toISOString().slice(0, 10)}.pdf`}
                mensagem={`Segue o relatório de inadimplência consolidado.\n\nAtenciosamente, Menezes Advocacia.`}
              />
            </div>
          </div>
        </div>

        {/* Cessão individual */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-6">
          <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
            Por cessão
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            Relatório de cessão individual
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Detalhamento completo de uma cessão: partes, valores,
            cronograma de parcelas e status de cada uma.
          </p>

          {cessoes.length === 0 ? (
            <p className="mt-4 text-xs text-[var(--muted)]">
              Cadastre uma cessão para gerar o relatório.
            </p>
          ) : (
            <ul className="mt-4 max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-black/30">
              {cessoes.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.cliente_nome}
                    </p>
                    <p className="font-mono text-xs text-[var(--muted)]">
                      {c.numero_contrato} · {formatBRL(c.valor_total)}
                    </p>
                  </div>
                  <a
                    href={`/api/relatorios/cessao/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-[var(--gold)] hover:underline"
                  >
                    PDF →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Extrato por cliente */}
      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-6">
        <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
          Por cliente
        </p>
        <h2 className="mt-1 text-lg font-semibold">
          Extrato consolidado por cliente principal
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Resumo financeiro completo: cessões, recebimentos, saldo devedor.
          Ideal para enviar ao próprio cliente como prestação de contas.
        </p>

        {clientes.length === 0 ? (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Cadastre um cliente para gerar o extrato.
          </p>
        ) : (
          <ul className="mt-4 grid max-h-96 grid-cols-1 gap-2 overflow-auto md:grid-cols-2">
            {clientes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.nome}</p>
                  <p className="font-mono text-xs text-[var(--muted)]">
                    {formatDocumento(c.documento)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={`/api/relatorios/extrato-cliente/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--gold)] hover:underline"
                  >
                    PDF
                  </a>
                  <WhatsAppShareButton
                    pdfUrl={`/api/relatorios/extrato-cliente/${c.id}`}
                    filename={`extrato-${c.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`}
                    mensagem={`Prezado(a) ${c.nome}, segue o seu extrato consolidado.\n\nAtenciosamente, Menezes Advocacia.`}
                    size="sm"
                    label=""
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Exportações CSV */}
      <section className="mt-8">
        <h3 className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">
          Exportações em CSV (Excel)
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ExportCard
            titulo="Cessões de crédito"
            descricao="Todas as cessões com cliente, cessionário, valores e status."
            href="/api/exportar/cessoes"
          />
          <ExportCard
            titulo="Pagamentos"
            descricao="Todas as parcelas (pagas e em aberto) com vencimento e status."
            href="/api/exportar/pagamentos"
          />
        </div>
      </section>
    </div>
  );
}

function ExportCard({
  titulo,
  descricao,
  href,
}: {
  titulo: string;
  descricao: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <div>
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{descricao}</p>
      </div>
      <a
        href={href}
        download
        className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-foreground hover:border-[var(--gold)]"
      >
        ⬇ CSV
      </a>
    </div>
  );
}
