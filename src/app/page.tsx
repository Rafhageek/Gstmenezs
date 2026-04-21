import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-3xl">
        <div className="mb-10 flex items-center gap-3">
          <BrandLogo size={40} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Menezes Advocacia
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Painel Financeiro
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-8 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
            Sistema de gestão de recebíveis
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            Cessão de crédito sob controle.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Plataforma moderna, segura e auditável para o escritório
            Menezes Advocacia substituir planilhas manuais por uma gestão
            financeira precisa e em conformidade com a OAB.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-[var(--gold)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)]"
              >
                Ir para o painel
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-[var(--gold)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)]"
              >
                Entrar no sistema
              </Link>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Sigilo profissional · Auditoria completa · Conformidade OAB
        </p>
      </div>
    </main>
  );
}
