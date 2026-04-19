import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/feedback";
import { CessaoForm } from "../cessao-form";
import type { ClientePrincipal, Cessionario } from "@/types/database";

export const metadata = {
  title: "Nova cessão — Painel MNZ",
};

export default async function NovaCessaoPage() {
  const supabase = await createClient();

  const [{ data: clientes }, { data: cessionarios }] = await Promise.all([
    supabase
      .from("clientes_principais")
      .select("id, nome, documento")
      .eq("ativo", true)
      .order("nome")
      .returns<Pick<ClientePrincipal, "id" | "nome" | "documento">[]>(),
    supabase
      .from("cessionarios")
      .select("id, nome, documento")
      .eq("ativo", true)
      .order("nome")
      .returns<Pick<Cessionario, "id" | "nome" | "documento">[]>(),
  ]);

  if (!clientes?.length || !cessionarios?.length) {
    return (
      <div>
        <PageHeader
          eyebrow="Operação"
          titulo="Nova cessão de crédito"
        />
        <Alert variant="warning">
          {!clientes?.length && (
            <>
              Cadastre ao menos um{" "}
              <Link
                href="/dashboard/clientes/novo"
                className="underline"
              >
                cliente principal
              </Link>{" "}
              antes de criar uma cessão.
              <br />
            </>
          )}
          {!cessionarios?.length && (
            <>
              Cadastre ao menos um{" "}
              <Link
                href="/dashboard/cessionarios/novo"
                className="underline"
              >
                cessionário
              </Link>{" "}
              antes de criar uma cessão.
            </>
          )}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        titulo="Nova cessão de crédito"
        descricao="Após salvar, as parcelas serão geradas automaticamente."
      />
      <CessaoForm clientes={clientes} cessionarios={cessionarios} />
    </div>
  );
}
