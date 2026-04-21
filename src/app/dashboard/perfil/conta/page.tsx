import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/feedback";
import { EmailForm } from "./email-form";
import { SenhaForm } from "./senha-form";

export const metadata = {
  title: "E-mail e senha — Painel Financeiro",
};

export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <PageHeader
        eyebrow="Meu perfil"
        titulo="E-mail e senha"
        descricao="Altere o e-mail de login e a senha da sua conta. Ambas as operações exigem confirmação da senha atual."
      />

      <div className="space-y-8">
        {/* Seção E-mail */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6">
          <header className="mb-5">
            <h2 className="text-base font-semibold">Alterar e-mail</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Um link de confirmação será enviado ao novo e-mail. A troca só
              acontece depois que você clicar no link.
            </p>
          </header>
          <EmailForm emailAtual={user?.email ?? ""} />
        </section>

        {/* Seção Senha */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6">
          <header className="mb-5">
            <h2 className="text-base font-semibold">Alterar senha</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Mínimo 8 caracteres. Use uma senha forte (combine letras,
              números e símbolos).
            </p>
          </header>
          <SenhaForm />
        </section>

        <Alert variant="warning">
          <strong>Segurança:</strong> se perder o acesso, use{" "}
          <a
            href="/recuperar-senha"
            className="underline"
          >
            Esqueci a senha
          </a>
          . Para desativar um dispositivo com biometria, vá em{" "}
          <a
            href="/dashboard/perfil/biometria"
            className="underline"
          >
            Biometria
          </a>
          .
        </Alert>
      </div>
    </div>
  );
}
