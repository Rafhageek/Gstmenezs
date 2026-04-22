import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/feedback";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import {
  formatBRL,
  formatDocumento,
  formatTelefone,
  digits,
} from "@/lib/format";
import type {
  ClientePrincipal,
  ExtratoCliente,
  CessaoResumo,
} from "@/types/database";

export const metadata = {
  title: "Detalhes do cliente — Painel Financeiro",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClienteDetalhesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [clienteRes, extratoRes] = await Promise.all([
    supabase
      .from("clientes_principais")
      .select("*")
      .eq("id", id)
      .single<ClientePrincipal>(),
    supabase
      .from("v_extrato_cliente")
      .select("*")
      .eq("cliente_id", id)
      .single<ExtratoCliente>(),
  ]);

  if (!clienteRes.data) notFound();
  const cliente = clienteRes.data;

  const { data: cessoes } = await supabase
    .from("v_cessoes_resumo")
    .select("*")
    .eq("cliente_id", id)
    .order("data_cessao", { ascending: false })
    .returns<CessaoResumo[]>();

  const extrato = extratoRes.data;
  const listaCessoes = cessoes ?? [];

  // Conta parcelas em atraso pra esse cliente
  const { count: parcelasAtrasadas } = await supabase
    .from("v_inadimplencia")
    .select("pagamento_id", { count: "exact", head: true })
    .eq("cliente_id", id);

  return (
    <div>
      <PageHeader
        eyebrow="Cliente principal"
        titulo={cliente.nome}
        descricao={formatDocumento(cliente.documento)}
      />

      {parcelasAtrasadas != null && parcelasAtrasadas > 0 && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-5 py-3"
        >
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[var(--danger)]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--danger)]">
              ⚠ Cliente com inadimplência
            </p>
            <p className="text-xs text-[var(--muted)]">
              {parcelasAtrasadas} parcela{parcelasAtrasadas === 1 ? "" : "s"} em atraso
              no total das cessões deste cliente.
            </p>
          </div>
          <Link
            href={`/dashboard/pagamentos?filtro=atrasados&cliente=${cliente.id}`}
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Ver parcelas →
          </Link>
        </div>
      )}

      <div className="-mt-2 mb-8 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/clientes/${cliente.id}/editar`}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-2 text-xs font-semibold hover:border-[var(--gold)]"
        >
          Editar cadastro
        </Link>
        <Link
          href="/dashboard/cessoes/nova"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/40 bg-transparent px-4 py-2 text-xs font-semibold text-[var(--gold)] transition-all hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
        >
          + Nova cessão
        </Link>
        <Link
          href="/dashboard/cessionarios/novo"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/40 bg-transparent px-4 py-2 text-xs font-semibold text-[var(--gold)] transition-all hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
        >
          + Novo cessionário
        </Link>
        <a
          href={`/api/relatorios/extrato-cliente/${cliente.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--background)] hover:bg-[var(--gold-hover)]"
        >
          ⬇ Extrato PDF
        </a>
        <WhatsAppShareButton
          pdfUrl={`/api/relatorios/extrato-cliente/${cliente.id}`}
          filename={`extrato-${cliente.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`}
          mensagem={`Prezado(a) ${cliente.nome}, segue o seu extrato consolidado.\n\nAtenciosamente, Menezes Advocacia.`}
          telefone={prepararTelWa(cliente.telefone)}
        />
      </div>

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

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <InfoCard titulo="Contato">
          <Info label="E-mail" value={cliente.email ?? ""} />
          <Info label="Telefone" value={formatTelefone(cliente.telefone)} />
        </InfoCard>
        <InfoCard titulo="Endereço">
          <p className="text-sm">
            {cliente.endereco ? formatarEndereco(cliente.endereco) : "—"}
          </p>
        </InfoCard>
      </section>

      {cliente.observacoes && (
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Observações internas
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {cliente.observacoes}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Cessões deste cliente ({listaCessoes.length})
        </h2>
        <DataTable
          headers={["Contrato", "Cessionário", "Valor", "Pago", "Status", ""]}
          rows={listaCessoes.map((c) => [
            <span key="n" className="font-mono text-xs">
              {c.numero_contrato}
            </span>,
            <span key="ce">{c.cessionario_nome}</span>,
            <span key="v" className="font-mono">
              {formatBRL(c.valor_total)}
            </span>,
            <span key="p" className="font-mono text-[var(--success)]">
              {formatBRL(c.valor_pago)}
            </span>,
            <StatusBadgeView
              key="s"
              status={c.status}
              atrasado={!!c.primeira_parcela_atrasada}
            />,
            <Link
              key="a"
              href={`/dashboard/cessoes/${c.id}`}
              className="text-xs text-[var(--gold)] hover:underline"
            >
              Abrir
            </Link>,
          ])}
          empty={
            <p className="text-sm text-[var(--muted)]">
              Este cliente ainda não tem cessões cadastradas.
            </p>
          }
        />
      </section>
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
  accent?: "muted" | "gold" | "success" | "danger";
}) {
  const colorMap = {
    muted: "text-foreground",
    gold: "text-[var(--gold)]",
    success: "text-[var(--success)]",
    danger: "text-[var(--danger)]",
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

function InfoCard({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {titulo}
      </p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}

function StatusBadgeView({
  status,
  atrasado,
}: {
  status: CessaoResumo["status"];
  atrasado: boolean;
}) {
  if (atrasado && status === "ativa") {
    return <Badge variant="warning">A receber (vencida)</Badge>;
  }
  const map: Record<CessaoResumo["status"], React.ReactNode> = {
    ativa: <Badge variant="gold">A receber</Badge>,
    quitada: <Badge variant="success">Liquidada</Badge>,
    inadimplente: <Badge variant="danger">Inadimplente</Badge>,
    cancelada: <Badge variant="neutral">Cancelada</Badge>,
  };
  return map[status];
}

function prepararTelWa(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const d = digits(raw);
  if (d.length !== 10 && d.length !== 11) return undefined;
  return `55${d}`;
}

function formatarEndereco(
  e: NonNullable<ClientePrincipal["endereco"]>,
): string {
  const parts = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join("/"),
    e.cep,
  ].filter(Boolean);
  return parts.join(" — ") || "—";
}
