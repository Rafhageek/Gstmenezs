import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Alert, Badge } from "@/components/ui/feedback";
import { SegurancaForm } from "./form";
import type { Profile } from "@/types/database";

export const metadata = {
  title: "Segurança 2FA — Painel MNZ",
};

export default async function SegurancaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("pergunta_seguranca, resposta_seguranca_hash")
    .eq("id", user!.id)
    .single<
      Pick<Profile, "pergunta_seguranca" | "resposta_seguranca_hash">
    >();

  const ativa = !!profile?.resposta_seguranca_hash;

  return (
    <div>
      <PageHeader
        eyebrow="Meu perfil"
        titulo="Segurança em 2 etapas"
        descricao="Após digitar a senha, o sistema perguntará algo pessoal antes de liberar o dashboard. Uma camada extra de proteção contra acesso indevido."
      />

      <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Status atual
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              {ativa ? (
                <>
                  <Badge variant="success">Ativa</Badge>
                  <span>Sua pergunta está configurada.</span>
                </>
              ) : (
                <>
                  <Badge variant="warning">Inativa</Badge>
                  <span>Nenhuma pergunta configurada.</span>
                </>
              )}
            </p>
            {ativa && profile?.pergunta_seguranca && (
              <p className="mt-3 rounded-md border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-3 py-2 text-xs">
                <strong className="text-[var(--gold)]">Sua pergunta:</strong>{" "}
                {profile.pergunta_seguranca}
              </p>
            )}
          </div>
        </div>
      </section>

      <SegurancaForm ativa={ativa} perguntaAtual={profile?.pergunta_seguranca ?? ""} />

      <section className="mt-8 rounded-xl border border-[var(--border)]/60 bg-[var(--background-elevated)]/40 p-5 text-xs text-[var(--muted)]">
        <p className="mb-2 font-semibold text-foreground">Como funciona</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Após o login (e-mail + senha), o sistema pede a{" "}
            <strong>resposta</strong> à sua pergunta.
          </li>
          <li>
            A resposta é <strong>normalizada</strong>: minúsculas, sem acentos e
            sem espaços. Ex.: &ldquo;João da Silva&rdquo;, &ldquo;joao da
            silva&rdquo; e &ldquo;JOAODASILVA&rdquo; são equivalentes.
          </li>
          <li>
            A resposta é guardada com <strong>hash bcrypt</strong> no banco —
            nem o administrador consegue ler.
          </li>
          <li>
            <strong>3 tentativas</strong> incorretas fazem logout automático.
          </li>
          <li>
            Escolha algo <strong>pessoal</strong> que só você sabe. Nunca use
            palavras simples como &ldquo;sim&rdquo;, &ldquo;não&rdquo; ou sua
            data de nascimento.
          </li>
        </ul>
      </section>

      <Alert variant="info">
        Esta é uma segurança <strong>adicional</strong>, complementando senha e
        biometria. Mesmo se alguém descobrir sua senha, precisará responder sua
        pergunta pessoal para entrar.
      </Alert>
    </div>
  );
}
