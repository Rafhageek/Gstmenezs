import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { getConfiguracoes } from "@/lib/configuracoes";
import type { Profile } from "@/types/database";
import { Verificacao2faForm } from "./form";
import { pularSeSemPergunta } from "./actions";

export const metadata = {
  title: "Verificação — Painel MNZ",
  robots: { index: false, follow: false },
};

export default async function Verificacao2faPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, pergunta_seguranca, resposta_seguranca_hash")
    .eq("id", user.id)
    .single<
      Pick<Profile, "nome" | "pergunta_seguranca" | "resposta_seguranca_hash">
    >();

  // Se não tem pergunta configurada, libera direto (seta cookie e vai para bem-vindo).
  if (!profile?.resposta_seguranca_hash) {
    const { liberado } = await pularSeSemPergunta();
    if (liberado) redirect("/bem-vindo");
  }

  const config = await getConfiguracoes();
  const pergunta =
    profile?.pergunta_seguranca ?? "Qual é sua pergunta de segurança?";
  const primeiroNome = profile?.nome?.split(" ")[0] ?? "Usuário";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
      {/* Background ambiente */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(600px circle at 20% 20%, rgba(201, 169, 97, 0.08), transparent 60%),
            radial-gradient(500px circle at 80% 80%, rgba(30, 58, 95, 0.35), transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="animate-fade-in-up mb-8 flex items-center gap-3">
          <BrandLogo size={44} />
          <div>
            <p className="font-serif-brand text-[11px] tracking-wide text-[var(--gold)]/90">
              {config.razao_social}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Painel MNZ
            </h1>
          </div>
        </div>

        <div className="animate-fade-in-up animate-delay-1 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10">
              <ShieldIcon />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
              Verificação de segurança
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Olá, {primeiroNome}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Para proteger os dados sigilosos do escritório, confirme a
              resposta à sua pergunta de segurança.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--gold)]">
              Pergunta
            </p>
            <p className="mt-1 text-sm font-medium">{pergunta}</p>
          </div>

          <Verificacao2faForm />

          <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="text-xs text-[var(--muted)] hover:text-foreground"
              >
                Sair e fazer novo login
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--muted)]/70">
          Segurança adicional · Máximo de 3 tentativas
        </p>
      </div>
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-[var(--gold)]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
