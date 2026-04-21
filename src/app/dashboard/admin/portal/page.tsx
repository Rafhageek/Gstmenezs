import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/feedback";
import { formatDataBR } from "@/lib/format";
import { NovoLinkForm } from "./novo-link-form";
import { CopiarLinkButton, RevogarLinkButton } from "./link-actions";
import type { ClientePrincipal, PortalLinkView } from "@/types/database";

export const metadata = {
  title: "Portal do contador — Painel Financeiro",
};

export default async function PortalAdminPage() {
  const supabase = await createClient();

  const [linksRes, clientesRes] = await Promise.all([
    supabase
      .from("v_portal_links")
      .select("*")
      .returns<PortalLinkView[]>(),
    supabase
      .from("clientes_principais")
      .select("id, nome, documento")
      .eq("ativo", true)
      .order("nome")
      .returns<Pick<ClientePrincipal, "id" | "nome" | "documento">[]>(),
  ]);

  const links = linksRes.data ?? [];
  const clientes = clientesRes.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Portal do contador"
        descricao="Gere links compartilháveis (read-only) para contadores acessarem dados de um cliente específico, sem precisar criar conta."
      />

      <NovoLinkForm clientes={clientes} />

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-10 text-center">
          <p className="text-sm text-[var(--muted)]">
            Nenhum link gerado ainda. Clique em{" "}
            <strong className="text-[var(--gold)]">+ Novo link</strong> acima.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente / descrição</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium">Validade</th>
                <th className="px-4 py-3 font-medium">Acessos</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-[var(--border)] align-top"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.cliente_nome}</div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">
                      {l.descricao}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {formatDataBR(l.created_at)}
                    <div>por {l.criado_por_nome ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {l.expires_at
                      ? formatDataBR(l.expires_at.slice(0, 10))
                      : "Sem expiração"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-mono">{l.acessos_total}</div>
                    {l.ultimo_acesso_em && (
                      <div className="text-[10px] text-[var(--muted)]">
                        último: {formatDataBR(l.ultimo_acesso_em.slice(0, 10))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3">
                    {l.status === "ativo" ? (
                      <div className="flex flex-col items-start gap-2">
                        <CopiarLinkButton token={l.token} />
                        <RevogarLinkButton linkId={l.id} />
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-[var(--border)]/60 bg-[var(--background-elevated)]/40 p-4 text-xs text-[var(--muted)]">
        <p>
          <strong>Sobre o portal:</strong> cada link dá acesso read-only aos
          dados de <strong>um cliente específico</strong> (extrato, cessões,
          parcelas e comprovantes). O contador abre o link no navegador — não
          precisa criar conta.
        </p>
        <p className="mt-2">
          Todos os acessos ao portal são registrados automaticamente nos logs
          de auditoria.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PortalLinkView["status"] }) {
  if (status === "ativo") return <Badge variant="success">Ativo</Badge>;
  if (status === "expirado") return <Badge variant="warning">Expirado</Badge>;
  return <Badge variant="danger">Revogado</Badge>;
}
