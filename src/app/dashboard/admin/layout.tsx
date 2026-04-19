import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  if (profile?.role !== "admin") {
    return <AcessoNegado />;
  }

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-2">
        <AdminTab href="/dashboard/admin/usuarios">Usuários</AdminTab>
        <AdminTab href="/dashboard/admin/logs">Logs de auditoria</AdminTab>
      </nav>
      {children}
    </div>
  );
}

function AdminTab({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--gold)]/40 hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function AcessoNegado() {
  return (
    <div className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-8 text-center">
      <p className="text-xs uppercase tracking-wide text-[var(--danger)]">
        Acesso restrito
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Área administrativa</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Esta área é restrita a usuários com perfil <strong>Administrador</strong>.
        Solicite ao administrador do sistema que altere seu perfil caso precise
        deste acesso.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block text-xs text-[var(--gold)] hover:underline"
      >
        ← Voltar ao painel
      </Link>
    </div>
  );
}
