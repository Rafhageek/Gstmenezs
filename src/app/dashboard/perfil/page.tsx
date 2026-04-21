import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { DadosPerfilForm } from "./dados-form";
import { formatDataBR } from "@/lib/format";
import type { Profile, LogAuditoriaView } from "@/types/database";

export const metadata = {
  title: "Meu perfil — Painel Financeiro",
};

const ACOES_LABEL: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Removeu",
  registrar_pagamento: "Registrou pagamento",
  estornar_pagamento: "Estornou pagamento",
  pagamento_parcial: "Pagamento parcial",
  editar_parcela: "Editou parcela",
  criar_portal_link: "Criou link do portal",
  revogar_portal_link: "Revogou link do portal",
};

const ENTIDADES_LABEL: Record<string, string> = {
  clientes_principais: "cliente",
  cessionarios: "cessionário",
  cessoes_credito: "cessão",
  pagamentos: "pagamento",
  portal_link: "link do portal",
  profiles: "perfil",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: atividade, count: totalAcoes }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single<Profile>(),
      supabase
        .from("v_logs_auditoria")
        .select("*", { count: "exact" })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5)
        .returns<LogAuditoriaView[]>(),
    ]);

  // Contar ações deste mês
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const { count: acoesMes } = await supabase
    .from("v_logs_auditoria")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .gte("created_at", inicioMes.toISOString());

  return (
    <div>
      <PageHeader
        eyebrow="Meu perfil"
        titulo="Dados pessoais"
        descricao="Seus dados de identificação. Aparecem na tela de boas-vindas e nos logs de auditoria."
      />

      {/* Mini dashboard pessoal */}
      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniKpi
          label="Ações este mês"
          value={String(acoesMes ?? 0)}
          sub="Operações registradas"
        />
        <MiniKpi
          label="Total de ações"
          value={String(totalAcoes ?? 0)}
          sub="Desde o cadastro"
        />
        <MiniKpi
          label="Membro desde"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                  timeZone: "America/Sao_Paulo",
                })
              : "—"
          }
          sub={profile?.ativo ? "Conta ativa" : "Conta desativada"}
        />
      </section>

      {/* Atividade recente */}
      {atividade && atividade.length > 0 && (
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">
            Sua atividade recente
          </h2>
          <ul className="space-y-2">
            {atividade.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)]/60 bg-black/10 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">
                    <strong className="text-[var(--gold)]">
                      {ACOES_LABEL[ev.acao] ?? ev.acao}
                    </strong>{" "}
                    <span className="text-[var(--muted)]">
                      {ENTIDADES_LABEL[ev.entidade] ?? ev.entidade}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  {formatDataBR(ev.created_at.slice(0, 10))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DadosPerfilForm profile={profile!} />
    </div>
  );
}

function MiniKpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--gold)]">{value}</p>
      {sub && (
        <p className="mt-1 text-[11px] text-[var(--muted)]/70">{sub}</p>
      )}
    </div>
  );
}
