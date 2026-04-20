import { notFound } from "next/navigation";
import { validarTokenPortal } from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConfiguracoes } from "@/lib/configuracoes";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/feedback";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import {
  formatBRL,
  formatDataBR,
  formatDocumento,
} from "@/lib/format";
import type {
  ClientePrincipal,
  ExtratoCliente,
  CessaoResumo,
  Pagamento,
} from "@/types/database";

export const metadata = {
  title: "Portal do contador — Menezes Advocacia",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PortalPage({ params }: Props) {
  const { token } = await params;
  const contexto = await validarTokenPortal(token);
  if (!contexto) return <AcessoNegado />;

  const admin = createAdminClient();

  // Busca dados do cliente, extrato e cessões — TUDO filtrado por cliente_id.
  const [clienteRes, extratoRes, cessoesIdsRes, config] = await Promise.all([
    admin
      .from("clientes_principais")
      .select("*")
      .eq("id", contexto.cliente_id)
      .single<ClientePrincipal>(),
    admin
      .from("v_extrato_cliente")
      .select("*")
      .eq("cliente_id", contexto.cliente_id)
      .single<ExtratoCliente>(),
    admin
      .from("cessoes_credito")
      .select("id")
      .eq("cliente_principal_id", contexto.cliente_id)
      .returns<{ id: string }[]>(),
    getConfiguracoes(),
  ]);

  if (clienteRes.error || !clienteRes.data) return notFound();
  const cliente = clienteRes.data;
  const extrato = extratoRes.data;

  const cessaoIds = (cessoesIdsRes.data ?? []).map((c) => c.id);
  const [cessoesRes, pagamentosRes] = cessaoIds.length
    ? await Promise.all([
        admin
          .from("v_cessoes_resumo")
          .select("*")
          .in("id", cessaoIds)
          .order("data_vencimento_inicial")
          .returns<CessaoResumo[]>(),
        admin
          .from("pagamentos")
          .select("*")
          .in("cessao_id", cessaoIds)
          .eq("is_reversal", false)
          .order("data_vencimento")
          .returns<Pagamento[]>(),
      ])
    : [
        { data: [] as CessaoResumo[] },
        { data: [] as Pagamento[] },
      ];

  const cessoes = cessoesRes.data ?? [];
  const pagamentos = pagamentosRes.data ?? [];
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--background-elevated)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                {config.razao_social}
              </p>
              <p className="text-sm font-semibold tracking-tight">
                Portal do contador
              </p>
            </div>
          </div>
          <Badge variant="gold">Somente leitura</Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
            Cliente principal
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {cliente.nome}
          </h1>
          <p className="mt-1 font-mono text-xs text-[var(--muted)]">
            {formatDocumento(cliente.documento)}
          </p>
        </div>

        {contexto.expires_at && (
          <div className="mb-6 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/5 px-4 py-3 text-xs text-[var(--muted)]">
            <strong className="text-[var(--gold)]">Acesso autorizado</strong> —{" "}
            {contexto.descricao}. Válido até{" "}
            <strong>{formatDataBR(contexto.expires_at.slice(0, 10))}</strong>.
          </div>
        )}

        {extrato && (
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Kpi label="Volume total" value={formatBRL(extrato.volume_total)} />
            <Kpi
              label="Recebido"
              value={formatBRL(extrato.total_recebido)}
              accent="success"
            />
            <Kpi
              label="Saldo a receber"
              value={formatBRL(extrato.saldo_devedor)}
              accent="gold"
            />
            <Kpi
              label="Cessões"
              value={`${extrato.total_cessoes} (${extrato.cessoes_quitadas} quit.)`}
            />
          </section>
        )}

        <section className="mb-8 flex flex-wrap gap-3">
          <a
            href={`/api/portal/${token}/pdf/extrato`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--background)] hover:bg-[var(--gold-hover)]"
          >
            ⬇ Extrato consolidado PDF
          </a>
          <WhatsAppShareButton
            pdfUrl={`/api/portal/${token}/pdf/extrato`}
            filename={`extrato-${cliente.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`}
            mensagem={`Extrato consolidado do cliente ${cliente.nome}.`}
          />
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Cessões ({cessoes.length})
          </h2>
          {cessoes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-10 text-center text-sm text-[var(--muted)]">
              Nenhuma cessão cadastrada.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Contrato</th>
                    <th className="px-4 py-3 font-medium">Cessionário</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-right font-medium">Pago</th>
                    <th className="px-4 py-3 text-right font-medium">% Pago</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cessoes.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {c.numero_contrato}
                      </td>
                      <td className="px-4 py-3">{c.cessionario_nome}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatBRL(c.valor_total)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--success)]">
                        {formatBRL(c.valor_pago)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {c.percentual_pago.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={c.status}
                          atrasado={!!c.primeira_parcela_atrasada}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/api/portal/${token}/pdf/cessao/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--gold)] hover:underline"
                        >
                          PDF →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Parcelas ({pagamentos.length})
          </h2>
          {pagamentos.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Sem parcelas.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
              <table className="w-full text-sm">
                <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vencimento</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Pago em</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((p) => {
                    const atrasado =
                      !p.data_pagamento && p.data_vencimento < hoje;
                    return (
                      <tr
                        key={p.id}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {formatDataBR(p.data_vencimento)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatBRL(p.valor)}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {formatDataBR(p.data_pagamento)}
                        </td>
                        <td className="px-4 py-3">
                          {p.data_pagamento ? (
                            <Badge variant="success">Pago</Badge>
                          ) : atrasado ? (
                            <Badge variant="danger">Atrasado</Badge>
                          ) : (
                            <Badge variant="gold">Aberto</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.comprovante_url && (
                            <a
                              href={`/api/portal/${token}/comprovante/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--gold)] hover:underline"
                            >
                              📎 Comprovante
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="border-t border-[var(--border)] pt-6 text-center">
          <p className="text-xs text-[var(--muted)]">
            Sigilo profissional · Acesso auditado · Conformidade OAB
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted)]/70">
            {config.razao_social}
            {config.cnpj && ` · CNPJ ${config.cnpj}`}
          </p>
        </footer>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = "muted",
}: {
  label: string;
  value: string;
  accent?: "muted" | "gold" | "success";
}) {
  const colorMap = {
    muted: "text-foreground",
    gold: "text-[var(--gold)]",
    success: "text-[var(--success)]",
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${colorMap[accent]}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  atrasado,
}: {
  status: CessaoResumo["status"];
  atrasado: boolean;
}) {
  if (atrasado && status === "ativa") {
    return <Badge variant="danger">Em atraso</Badge>;
  }
  const map: Record<CessaoResumo["status"], React.ReactNode> = {
    ativa: <Badge variant="gold">Ativa</Badge>,
    quitada: <Badge variant="success">Quitada</Badge>,
    inadimplente: <Badge variant="danger">Inadimplente</Badge>,
    cancelada: <Badge variant="neutral">Cancelada</Badge>,
  };
  return map[status];
}

function AcessoNegado() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <BrandLogo size={48} />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Acesso não disponível
        </h1>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Este link é inválido, foi revogado ou expirou. Solicite um novo
          link ao escritório responsável.
        </p>
      </div>
    </div>
  );
}
