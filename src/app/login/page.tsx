import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { BalancaJusticaAnimada } from "@/components/balanca-justica-animada";
import { getConfiguracoes } from "@/lib/configuracoes";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar — Painel Financeiro",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const config = await getConfiguracoes();

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
      {/* Background ambiente */}
      <BackgroundAmbiente />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="animate-fade-in-up animate-delay-1 mb-8 flex items-center gap-3">
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

        <div className="animate-fade-in-up animate-delay-2 rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h2 className="text-xl font-semibold tracking-tight">
            Acesso ao sistema
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Restrito a advogados e equipe autorizada do escritório.
          </p>

          <LoginForm />
        </div>

        <p className="animate-fade-in-up animate-delay-3 mt-6 text-center text-xs text-[var(--muted)]">
          Sigilo profissional · Auditoria completa · Conformidade OAB
        </p>
      </div>
    </main>
  );
}

/** Ambiente visual: gradientes radiais sutis + grid de pontos + balança da justiça. */
function BackgroundAmbiente() {
  return (
    <>
      {/* Blobs de cor */}
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
      {/* Grid de pontos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(201, 169, 97, 0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      {/* Balança da justiça — elemento temático (desktop apenas, lado esquerdo) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-1/2 hidden -translate-y-1/2 opacity-[0.28] lg:block xl:left-[14%] xl:opacity-[0.38]"
      >
        <BalancaJusticaAnimada size={440} />
      </div>
      {/* Balança da justiça — elemento temático (mobile: topo, bem discreta) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-[0.12] lg:hidden"
      >
        <BalancaJusticaAnimada size={260} />
      </div>
    </>
  );
}
