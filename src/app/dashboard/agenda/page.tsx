import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { formatBRL } from "@/lib/format";
import type {
  Pagamento,
  CessaoCredito,
  ClientePrincipal,
} from "@/types/database";

export const metadata = {
  title: "Agenda — Painel Financeiro",
};

interface SearchParams {
  mes?: string; // formato YYYY-MM
}

interface PagamentoFull extends Pagamento {
  cessao: Pick<CessaoCredito, "numero_contrato"> & {
    cliente_principal: Pick<ClientePrincipal, "nome">;
  };
}

const MESES_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DIAS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const hoje = new Date();
  const mesBase = sp.mes
    ? new Date(`${sp.mes}-01T00:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const ano = mesBase.getFullYear();
  const mes = mesBase.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0=dom
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const inicioISO = new Date(ano, mes, 1).toISOString().slice(0, 10);
  const fimISO = new Date(ano, mes, diasNoMes).toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .select(
      `*, cessao:cessoes_credito!inner(numero_contrato, cliente_principal:clientes_principais!inner(nome))`,
    )
    .eq("is_reversal", false)
    .gte("data_vencimento", inicioISO)
    .lte("data_vencimento", fimISO)
    .order("data_vencimento")
    .returns<PagamentoFull[]>();

  const pagamentos = error ? [] : (data ?? []);

  // Agrupa por dia (1..diasNoMes)
  const porDia = new Map<number, PagamentoFull[]>();
  for (const p of pagamentos) {
    const d = Number(p.data_vencimento.slice(8, 10));
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d)!.push(p);
  }

  // Totais do mês
  const totalPrevisto = pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const totalPago = pagamentos
    .filter((p) => p.data_pagamento !== null)
    .reduce((s, p) => s + Number(p.valor), 0);

  const mesAnterior = navegarMes(ano, mes, -1);
  const proximoMes = navegarMes(ano, mes, 1);
  const mesAtualISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const ehMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth();

  return (
    <div>
      <PageHeader
        eyebrow="Vencimentos"
        titulo="Agenda"
        descricao="Visão mensal dos pagamentos previstos e realizados."
      />

      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/agenda?mes=${mesAnterior}`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:border-[var(--gold)]"
          >
            ← {nomeMes(mesAnterior)}
          </Link>
          <h2 className="px-4 text-lg font-semibold tracking-tight">
            {MESES_PT[mes]} de {ano}
          </h2>
          <Link
            href={`/dashboard/agenda?mes=${proximoMes}`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:border-[var(--gold)]"
          >
            {nomeMes(proximoMes)} →
          </Link>
        </div>
        {!ehMesAtual && (
          <Link
            href={`/dashboard/agenda?mes=${mesAtualISO}`}
            className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs text-[var(--gold)]"
          >
            Ir para hoje
          </Link>
        )}
      </nav>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi label="Parcelas no mês" value={String(pagamentos.length)} />
        <Kpi label="Total previsto" value={formatBRL(totalPrevisto)} accent="gold" />
        <Kpi label="Já recebido" value={formatBRL(totalPago)} accent="success" />
      </section>

      {/* Calendário */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-black/30">
          {DIAS_PT.map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div
              key={`vazio-${i}`}
              className="min-h-[110px] border-b border-r border-[var(--border)] bg-black/20"
            />
          ))}
          {Array.from({ length: diasNoMes }).map((_, i) => {
            const dia = i + 1;
            const dataISO = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const isHoje =
              dataISO ===
              `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
            const itens = porDia.get(dia) ?? [];
            return (
              <div
                key={dia}
                className={`min-h-[110px] border-b border-r border-[var(--border)] p-2 ${
                  isHoje ? "bg-[var(--gold)]/5" : ""
                }`}
              >
                <div
                  className={`text-xs font-semibold ${
                    isHoje ? "text-[var(--gold)]" : "text-[var(--muted)]"
                  }`}
                >
                  {dia}
                </div>
                <ul className="mt-1 space-y-1">
                  {itens.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/dashboard/cessoes/${p.cessao_id}`}
                        className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${statusBg(
                          p,
                          dataISO,
                        )}`}
                        title={`${p.cessao.cliente_principal.nome} · ${p.cessao.numero_contrato} · ${formatBRL(p.valor)}`}
                      >
                        {formatBRL(p.valor)}
                      </Link>
                    </li>
                  ))}
                  {itens.length > 3 && (
                    <li className="text-[10px] text-[var(--muted)]">
                      + {itens.length - 3} mais
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista linear abaixo para mobile */}
      <section className="mt-8 md:hidden">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Lista de parcelas
        </h3>
        <ul className="space-y-2">
          {pagamentos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/cessoes/${p.cessao_id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {p.cessao.cliente_principal.nome}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {p.data_vencimento.slice(8, 10)}/
                    {p.data_vencimento.slice(5, 7)} ·{" "}
                    {p.cessao.numero_contrato}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm ${
                    p.data_pagamento
                      ? "text-[var(--success)]"
                      : "text-[var(--gold)]"
                  }`}
                >
                  {formatBRL(p.valor)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
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

function statusBg(p: PagamentoFull, dataDia: string): string {
  if (p.data_pagamento) {
    return "bg-[var(--success)]/15 text-[var(--success)] hover:bg-[var(--success)]/25";
  }
  const hojeISO = new Date().toISOString().slice(0, 10);
  if (dataDia < hojeISO) {
    return "bg-[var(--danger)]/15 text-[var(--danger)] hover:bg-[var(--danger)]/25";
  }
  return "bg-[var(--gold)]/15 text-[var(--gold)] hover:bg-[var(--gold)]/25";
}

function navegarMes(ano: number, mes: number, delta: number): string {
  const d = new Date(ano, mes + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeMes(iso: string): string {
  const [, mm] = iso.split("-");
  return MESES_PT[Number(mm) - 1];
}
