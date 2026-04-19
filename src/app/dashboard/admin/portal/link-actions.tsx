"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { revogarLinkPortal } from "./actions";

export function CopiarLinkButton({ token }: { token: string }) {
  async function onClick() {
    const url = `${window.location.origin}/portal/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }
  return (
    <Button size="sm" variant="secondary" onClick={onClick}>
      📋 Copiar link
    </Button>
  );
}

export function RevogarLinkButton({ linkId }: { linkId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    startTransition(async () => {
      const res = await revogarLinkPortal(linkId);
      if (res.error) {
        toast.error("Erro ao revogar", { description: res.error });
      } else {
        toast.success("Link revogado");
      }
      setConfirming(false);
    });
  }

  return (
    <Button
      size="sm"
      variant="danger"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "..." : confirming ? "Confirmar revogação?" : "Revogar"}
    </Button>
  );
}
