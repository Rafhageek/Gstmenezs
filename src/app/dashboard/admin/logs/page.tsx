import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/feedback";
import { LogJsonDiff } from "./log-json-diff";
import type { LogAuditoriaView } from "@/types/database";

export const metadata = {
  title: "Logs de auditoria — Painel Financeiro",
};

interface SearchParams {
  acao?: string;
  entidade?: string;
  pagina?: string;
}

const PAGE_SIZE = 50;

const ACOES = ["create", "update", "delete", "registrar_pagamento", "estornar_pagamento"];
const ENTIDADES = [
  "clientes_principais",
  "cessionarios",
  "cessoes_credito",
  "pagamentos",
  "profiles",
];

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const offset = (pagina - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase
    .from("v_logs_auditoria")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (sp.acao) query = query.eq("acao", sp.acao);
  if (sp.entidade) query = query.eq("entidade", sp.entidade);

  const { data, error, count } = await query.returns<LogAuditoriaView[]>();

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Administração" titulo="Logs de auditoria" />
        <p className="text-sm text-[var(--danger)]">{error.message}</p>
      </div>
    );
  }

  const logs = data ?? [];
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Logs de auditoria"
        descricao={`${total.toLocaleString("pt-BR")} registro${total === 1 ? "" : "s"} no histórico do sistema. Trilha completa para conformidade OAB.`}
      />

      {/* Filtros */}
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--muted)]">
            Ação
          </label>
          <select
            name="acao"
            defaultValue={sp.acao ?? ""}
            className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {ACOES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--muted)]">
            Entidade
          </label>
          <select
            name="entidade"
            defaultValue={sp.entidade ?? ""}
            className="rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {ENTIDADES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--background)] hover:bg-[var(--gold-hover)]"
        >
          Filtrar
        </button>
        {(sp.acao || sp.entidade) && (
          <Link
            href="/dashboard/admin/logs"
            className="text-xs text-[var(--muted)] hover:text-foreground"
          >
            Limpar filtros
          </Link>
        )}
      </form>

      {/* Lista */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-10 text-center">
            <p className="text-sm text-[var(--muted)]">
              Nenhum registro encontrado com esses filtros.
            </p>
          </div>
        ) : (
          logs.map((log) => <LogItem key={log.id} log={log} />)
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <nav className="mt-6 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            Página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            {pagina > 1 && (
              <PaginaLink
                pagina={pagina - 1}
                acao={sp.acao}
                entidade={sp.entidade}
                label="← Anterior"
              />
            )}
            {pagina < totalPaginas && (
              <PaginaLink
                pagina={pagina + 1}
                acao={sp.acao}
                entidade={sp.entidade}
                label="Próxima →"
              />
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function PaginaLink({
  pagina,
  acao,
  entidade,
  label,
}: {
  pagina: number;
  acao?: string;
  entidade?: string;
  label: string;
}) {
  const params = new URLSearchParams();
  params.set("pagina", String(pagina));
  if (acao) params.set("acao", acao);
  if (entidade) params.set("entidade", entidade);
  return (
    <Link
      href={`/dashboard/admin/logs?${params}`}
      className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-[var(--gold)]"
    >
      {label}
    </Link>
  );
}

function LogItem({ log }: { log: LogAuditoriaView }) {
  const dt = new Date(log.created_at);
  const dataFmt = dt.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <details className="group rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4 open:border-[var(--gold)]/40">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm marker:hidden">
        <AcaoBadge acao={log.acao} />
        <span className="font-mono text-xs text-[var(--muted)]">
          {log.entidade}
        </span>
        {log.entidade_id && (
          <span className="font-mono text-[10px] text-[var(--muted)]/70">
            {log.entidade_id.slice(0, 8)}…
          </span>
        )}
        <span className="ml-auto text-xs text-[var(--muted)]">
          por <strong className="text-foreground">{log.user_nome}</strong>
          {log.user_role && (
            <span className="ml-1 text-[var(--gold)]">({log.user_role})</span>
          )}
        </span>
        <span className="text-xs text-[var(--muted)] tabular-nums">
          {dataFmt}
        </span>
      </summary>

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <LogJsonDiff
          anteriores={log.dados_anteriores}
          novos={log.dados_novos}
        />
      </div>
    </details>
  );
}

function AcaoBadge({ acao }: { acao: string }) {
  const map: Record<string, "success" | "danger" | "gold" | "neutral"> = {
    create: "success",
    update: "gold",
    delete: "danger",
    registrar_pagamento: "success",
    estornar_pagamento: "danger",
  };
  return <Badge variant={map[acao] ?? "neutral"}>{acao}</Badge>;
}
