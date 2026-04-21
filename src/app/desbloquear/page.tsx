import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { getConfiguracoes } from "@/lib/configuracoes";
import type { Passkey } from "@/types/database";
import { DesbloqueioForm } from "./form";

export const metadata = {
  title: "Desbloquear — Painel Financeiro",
};

const UNLOCK_COOKIE = "mnz_unlock_at";

export default async function DesbloquearPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destino =
    next && next.startsWith("/dashboard") ? next : "/dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();

  // Se cookie de unlock existe, já está desbloqueado (maxAge controla validade).
  if (cookieStore.get(UNLOCK_COOKIE)?.value) {
    redirect(destino);
  }

  const { data: passkeys } = await supabase
    .from("passkeys")
    .select("id, nome_dispositivo")
    .eq("user_id", user.id)
    .returns<Pick<Passkey, "id" | "nome_dispositivo">[]>();

  // Se não tem passkey, seta unlock direto (evita loop com middleware)
  if (!passkeys || passkeys.length === 0) {
    cookieStore.set({
      name: UNLOCK_COOKIE,
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    redirect(destino);
  }

  const config = await getConfiguracoes();

  const nomeExibicao =
    (user.user_metadata?.nome as string | undefined) ??
    user.email?.split("@")[0] ??
    "Usuário";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="animate-fade-in-up mb-8 flex items-center gap-3">
          <BrandLogo size={44} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              {config.razao_social}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Painel Financeiro
            </h1>
          </div>
        </div>

        <div className="animate-fade-in-up animate-delay-1 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--gold)]"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Olá, {nomeExibicao}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Confirme sua identidade para acessar o painel.
            </p>
          </div>

          <div className="mt-6">
            <DesbloqueioForm destino={destino} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Sigilo profissional · Auditoria completa · Conformidade OAB
        </p>
      </div>
    </main>
  );
}
