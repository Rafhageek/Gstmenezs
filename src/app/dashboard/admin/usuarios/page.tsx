import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/feedback";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDataBR } from "@/lib/format";
import {
  MudarRoleSelect,
  AlternarAtivoButton,
  ResetarSenhaButton,
} from "./usuario-row-actions";
import type { Profile } from "@/types/database";

export const metadata = {
  title: "Usuários — Painel MNZ",
};

export default async function UsuariosAdminPage() {
  const supabase = await createClient();
  const {
    data: { user: usuarioAtual },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("nome")
    .returns<Profile[]>();

  if (error) {
    return (
      <div>
        <PageHeader
          eyebrow="Administração"
          titulo="Usuários do sistema"
        />
        <p className="text-sm text-[var(--danger)]">{error.message}</p>
      </div>
    );
  }

  const usuarios = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        titulo="Usuários do sistema"
        descricao="Gerencie quem tem acesso ao painel e seus respectivos perfis."
        acao={{
          label: "+ Novo usuário",
          href: "/dashboard/admin/usuarios/novo",
        }}
      />

      {usuarios.length === 0 ? (
        <EmptyState tipo="usuarios" />
      ) : (
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">OAB</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Cadastrado em</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const isSelf = u.id === usuarioAtual?.id;
              return (
                <tr
                  key={u.id}
                  className="border-t border-[var(--border)] align-top"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {u.nome}
                      {isSelf && (
                        <span className="ml-2 text-xs text-[var(--gold)]">
                          (você)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <MudarRoleSelect
                      userId={u.id}
                      roleAtual={u.role}
                      isSelf={isSelf}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                    {u.oab || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.ativo ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="neutral">Desativado</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {formatDataBR(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <AlternarAtivoButton
                        userId={u.id}
                        ativo={u.ativo}
                        isSelf={isSelf}
                      />
                      <ResetarSenhaButton userId={u.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      <div className="mt-4 flex justify-end">
        <Link
          href="/dashboard"
          className="text-xs text-[var(--muted)] hover:text-foreground"
        >
          ← Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
