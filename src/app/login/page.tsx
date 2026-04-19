import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar — Painel MNZ",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <BrandLogo size={40} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Menezes Advocacia
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Painel MNZ
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-8 shadow-2xl shadow-black/30">
          <h2 className="text-xl font-semibold tracking-tight">
            Acesso ao sistema
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Restrito a advogados e equipe autorizada do escritório.
          </p>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Sigilo profissional · Auditoria completa · Conformidade OAB
        </p>
      </div>
    </main>
  );
}
