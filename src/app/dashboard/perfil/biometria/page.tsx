import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/feedback";
import { BiometriaManager } from "./manager";
import type { Passkey } from "@/types/database";

export const metadata = {
  title: "Biometria — Painel MNZ",
};

export default async function BiometriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: passkeys } = await supabase
    .from("passkeys")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<Passkey[]>();

  return (
    <div>
      <PageHeader
        eyebrow="Meu perfil"
        titulo="Desbloqueio com biometria"
        descricao="Cadastre Face ID, Touch ID ou impressão digital para entrar no sistema sem digitar a senha neste dispositivo."
      />

      <BiometriaManager passkeys={passkeys ?? []} />

      <section className="mt-8 rounded-xl border border-[var(--border)]/60 bg-[var(--background-elevated)]/40 p-5 text-xs text-[var(--muted)]">
        <p className="mb-2 font-semibold text-foreground">Como funciona</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            A biometria fica <strong>no seu aparelho</strong> (Face ID, Touch ID,
            digital do Android). Nada sensível é enviado ao servidor.
          </li>
          <li>
            Após o primeiro login com senha, o sistema pede biometria nas
            próximas aberturas do app (por 12 horas antes de pedir novamente).
          </li>
          <li>
            Se perder o dispositivo, entre por outro device com a senha normal e
            remova a biometria antiga daqui.
          </li>
          <li>
            Sua senha continua funcionando como alternativa. A biometria é só
            um atalho seguro.
          </li>
        </ul>

        {passkeys && passkeys.length > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-2">
            <Badge variant="gold">Ativa</Badge>
            <span className="text-foreground">
              {passkeys.length}{" "}
              {passkeys.length === 1
                ? "dispositivo cadastrado"
                : "dispositivos cadastrados"}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
