"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { autenticarPasskey } from "@/lib/passkey-client";

export function DesbloqueioForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const jaTentouRef = useRef(false);

  function desbloquear() {
    setError(null);
    startTransition(async () => {
      const res = await autenticarPasskey();
      if (res.ok) {
        toast.success("Desbloqueado");
        router.replace(destino);
        router.refresh();
      } else {
        setError(res.error ?? "Falha ao desbloquear");
      }
    });
  }

  // Tenta desbloquear automaticamente ao entrar na página (uma única vez).
  // Usar ref (não state) evita re-render e setState-em-effect.
  useEffect(() => {
    if (jaTentouRef.current) return;
    jaTentouRef.current = true;
    desbloquear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <Button
        onClick={desbloquear}
        disabled={pending}
        className="w-full"
      >
        {pending ? "Aguardando biometria..." : "🔓 Desbloquear com biometria"}
      </Button>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="border-t border-[var(--border)] pt-4 text-center">
        <p className="text-xs text-[var(--muted)]">Preferir usar a senha?</p>
        <form action="/auth/sign-out" method="post" className="mt-2">
          <button
            type="submit"
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Sair e fazer login com e-mail e senha
          </button>
        </form>
      </div>
    </div>
  );
}
