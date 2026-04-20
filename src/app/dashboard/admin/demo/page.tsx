import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DemoClient } from "./demo-client";

export const metadata = {
  title: "Dados demo — Painel MNZ",
};

interface DemoCounts {
  clientes: number;
  cessionarios: number;
  cessoes: number;
  pagamentos: number;
}

export default async function DemoAdminPage() {
  const supabase = await createClient();

  const { data: counts } = await supabase
    .from("v_demo_counts")
    .select("*")
    .maybeSingle<DemoCounts>();

  const totals = counts ?? {
    clientes: 0,
    cessionarios: 0,
    cessoes: 0,
    pagamentos: 0,
  };

  const totalRegistros =
    totals.clientes +
    totals.cessionarios +
    totals.cessoes +
    totals.pagamentos;

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Dados demo"
        descricao="Popule dados fictícios para apresentar o sistema. Todos os registros demo são marcados com [DEMO] nas observações e podem ser apagados de uma vez."
      />

      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Clientes demo" value={totals.clientes} />
        <StatCard label="Cessionários demo" value={totals.cessionarios} />
        <StatCard label="Cessões demo" value={totals.cessoes} />
        <StatCard label="Pagamentos demo" value={totals.pagamentos} />
      </section>

      <section className="mb-6 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--gold)]">
          O que o seed cria
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="font-semibold mb-1">6 clientes fictícios</p>
            <ul className="list-disc pl-5 text-xs text-[var(--muted)] space-y-1">
              <li>Marcos André de Andrade (principal)</li>
              <li>Ana Paula Ribeiro, Carlos Eduardo Santos</li>
              <li>Empresa Alpha Ltda, Beatriz Oliveira, Roberto Castro</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">6 cessionários (PJ + PF)</p>
            <ul className="list-disc pl-5 text-xs text-[var(--muted)] space-y-1">
              <li>Crédito Certo, Invest Milhão, Fundo Recebe+ (PJ)</li>
              <li>João Silva, Maria Aparecida (PF)</li>
              <li>Grupo Investe Sul (PJ)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">10 cessões variadas</p>
            <ul className="list-disc pl-5 text-xs text-[var(--muted)] space-y-1">
              <li>3 liquidadas (com todas parcelas pagas)</li>
              <li>4 a receber (algumas com pagamentos parciais)</li>
              <li>2 inadimplentes (parcelas atrasadas)</li>
              <li>1 cancelada</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Cenários cobertos</p>
            <ul className="list-disc pl-5 text-xs text-[var(--muted)] space-y-1">
              <li>Dashboard com "Sessões Liquidadas" preenchido</li>
              <li>Gráficos de fluxo mensal + pizza</li>
              <li>Aging (valor a receber por período)</li>
              <li>Inadimplência em destaque + filtros</li>
            </ul>
          </div>
        </div>
      </section>

      <DemoClient totalRegistros={totalRegistros} />

      <section className="mt-8 rounded-xl border border-dashed border-[var(--border)] p-5 text-xs text-[var(--muted)]">
        <p className="font-semibold text-foreground mb-2">
          🔒 Segurança dos dados reais
        </p>
        <p>
          O botão <strong>Apagar dados demo</strong> remove apenas registros cujo
          campo <code className="rounded bg-black/30 px-1">observacoes</code>{" "}
          começa com <code className="rounded bg-black/30 px-1">[DEMO]</code>.
          Dados reais do escritório <strong>nunca são afetados</strong>.
        </p>
        <p className="mt-2">
          A ação é executada por RPCs{" "}
          <code className="rounded bg-black/30 px-1">
            popular_dados_demo()
          </code>{" "}
          e{" "}
          <code className="rounded bg-black/30 px-1">
            limpar_dados_demo()
          </code>{" "}
          no Supabase, protegidas por checagem de role{" "}
          <code className="rounded bg-black/30 px-1">admin</code>.
        </p>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold font-mono">{value}</p>
    </div>
  );
}
