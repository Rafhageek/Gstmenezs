"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Confetti } from "@/components/confetti";

interface Props {
  cessaoId: string;
  quitada: boolean;
  numeroContrato: string;
}

const STORAGE_PREFIX = "painelmnz:quitacao_celebrada:";

/**
 * Dispara confetti + toast de celebração na PRIMEIRA vez que o usuário
 * vê a cessão como quitada. Usa localStorage pra não repetir em cada
 * navegação subsequente.
 */
export function CelebracaoQuitacao({
  cessaoId,
  quitada,
  numeroContrato,
}: Props) {
  const [active, setActive] = useState(false);
  const jaRodou = useRef(false);

  useEffect(() => {
    if (!quitada || jaRodou.current) return;
    try {
      const key = `${STORAGE_PREFIX}${cessaoId}`;
      if (localStorage.getItem(key)) return; // já celebrou
      localStorage.setItem(key, "1");
    } catch {
      /* localStorage indisponível — segue assim mesmo */
    }
    jaRodou.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(true);
    toast.success(`🎉 Cessão ${numeroContrato} quitada!`, {
      description: "Parabéns! Todos os pagamentos foram recebidos.",
      duration: 6000,
    });

    const t = setTimeout(() => setActive(false), 2000);
    return () => clearTimeout(t);
  }, [cessaoId, quitada, numeroContrato]);

  return <Confetti active={active} duration={1800} count={40} />;
}
