import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileNav } from "@/components/mobile-nav";
import { BrandLogo } from "@/components/brand-logo";
import { NotificationsBell } from "@/components/notifications-bell";
import { CommandPalette } from "@/components/command-palette";
import { NavLink } from "@/components/nav-link";
import { NavDropdown } from "@/components/nav-dropdown";
import { UserMenu } from "@/components/user-menu";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import type {
  Profile,
  ParcelaProxima,
  InadimplenciaItem,
} from "@/types/database";

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

  const [{ data: profile }, { data: proximasRaw }, { data: atrasadasRaw }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("nome, email, role")
        .eq("id", user.id)
        .single<Pick<Profile, "nome" | "email" | "role">>(),
      supabase
        .from("v_parcelas_proximas")
        .select("*")
        .returns<ParcelaProxima[]>(),
      supabase
        .from("v_inadimplencia")
        .select("*")
        .returns<InadimplenciaItem[]>(),
    ]);

  const proximas = proximasRaw ?? [];
  const atrasadas = atrasadasRaw ?? [];

  const nomeExibicao =
    profile?.nome ?? user.email?.split("@")[0] ?? "Usuário";

  // Menu mobile mantém lista flat (drawer lateral)
  const navItemsMobile = [
    { href: "/dashboard", label: "Visão geral" },
    { href: "/dashboard/clientes", label: "Clientes" },
    { href: "/dashboard/cessionarios", label: "Cessionários" },
    { href: "/dashboard/cessoes", label: "Cessões" },
    { href: "/dashboard/pagamentos", label: "Pagamentos" },
    { href: "/dashboard/agenda", label: "Agenda" },
    { href: "/dashboard/relatorios", label: "Relatórios" },
    { href: "/dashboard/perfil/biometria", label: "Biometria" },
    ...(profile?.role === "admin"
      ? [
          { href: "/dashboard/admin/usuarios", label: "Admin · Usuários" },
          { href: "/dashboard/admin/portal", label: "Admin · Portal" },
          { href: "/dashboard/admin/importar", label: "Admin · Importar" },
          { href: "/dashboard/admin/logs", label: "Admin · Logs" },
          {
            href: "/dashboard/admin/configuracoes",
            label: "Admin · Configurações",
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background-elevated)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          {/* Branding */}
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-3"
          >
            <BrandLogo size={34} />
            <div className="leading-tight">
              <p className="font-serif-brand text-[11px] tracking-wide text-[var(--gold)]/90">
                Menezes Advocacia
              </p>
              <p className="text-sm font-semibold tracking-tight">
                Painel MNZ
              </p>
            </div>
          </Link>

          {/* Menu principal — somente desktop */}
          <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
            <NavLink href="/dashboard" exact>
              Visão geral
            </NavLink>

            <NavLink href="/dashboard/cessionarios">Cessionários</NavLink>

            <NavDropdown
              label="Operação"
              items={[
                {
                  href: "/dashboard/cessoes",
                  label: "Cessões",
                  descricao: "Contratos de cessão de crédito",
                },
                {
                  href: "/dashboard/pagamentos",
                  label: "Pagamentos",
                  descricao: "Parcelas e comprovantes",
                },
                {
                  href: "/dashboard/agenda",
                  label: "Agenda",
                  descricao: "Vencimentos do mês",
                },
                {
                  href: "/dashboard/clientes",
                  label: "Clientes principais",
                  descricao: "Cedentes do crédito",
                },
              ]}
            />

            <NavLink href="/dashboard/relatorios">Relatórios</NavLink>
          </nav>

          {/* Ações à direita */}
          <div className="flex shrink-0 items-center gap-2">
            <CommandPalette />
            <ThemeToggle />
            <NotificationsBell
              proximas={proximas}
              atrasadas={atrasadas}
            />
            <div className="hidden md:block">
              <UserMenu
                nome={nomeExibicao}
                email={profile?.email ?? user.email ?? ""}
                role={profile?.role}
              />
            </div>
            <MobileNav items={navItemsMobile} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
