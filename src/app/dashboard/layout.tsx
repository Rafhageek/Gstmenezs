import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "@/components/mobile-nav";
import { BrandLogo } from "@/components/brand-logo";
import type { Profile } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, email, role")
    .eq("id", user.id)
    .single<Pick<Profile, "nome" | "email" | "role">>();

  const nomeExibicao =
    profile?.nome ?? user.email?.split("@")[0] ?? "Usuário";
  const roleLabel = roleToLabel(profile?.role);

  const navItems = [
    { href: "/dashboard", label: "Visão geral" },
    { href: "/dashboard/clientes", label: "Clientes" },
    { href: "/dashboard/cessionarios", label: "Cessionários" },
    { href: "/dashboard/cessoes", label: "Cessões" },
    { href: "/dashboard/pagamentos", label: "Pagamentos" },
    { href: "/dashboard/relatorios", label: "Relatórios" },
    ...(profile?.role === "admin"
      ? [{ href: "/dashboard/admin/usuarios", label: "Admin" }]
      : []),
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background-elevated)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <BrandLogo size={32} />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Menezes Advocacia
              </p>
              <p className="text-sm font-semibold tracking-tight">
                Painel MNZ
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">{nomeExibicao}</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--gold)]">
                {roleLabel}
              </p>
            </div>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="hidden rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--gold)] hover:text-foreground md:inline-flex"
              >
                Sair
              </button>
            </form>
            <MobileNav items={navItems} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function roleToLabel(role: Profile["role"] | undefined): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "financeiro":
      return "Financeiro";
    case "contador":
      return "Contador";
    default:
      return "Usuário";
  }
}
