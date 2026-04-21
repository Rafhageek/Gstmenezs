import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";
import { getConfiguracoes } from "@/lib/configuracoes";
import { NovaSenhaForm } from "./form";

export const metadata = {
  title: "Definir nova senha — Painel Financeiro",
};

export default async function NovaSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/recuperar-senha");

  const config = await getConfiguracoes();

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
          <h2 className="text-xl font-semibold tracking-tight">Nova senha</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Escolha uma senha forte. Ela será aplicada imediatamente.
          </p>

          <NovaSenhaForm />

          <div className="mt-6 text-center">
            <Link
              href="/dashboard"
              className="text-xs text-[var(--muted)] hover:text-foreground"
            >
              Ir para o painel →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
