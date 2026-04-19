"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Valor final (pode ser negativo). */
  value: number;
  /** Duração da animação em ms. */
  duration?: number;
  /** Função para formatar o número em cada tick (ex.: formatBRL). */
  format: (n: number) => string;
  className?: string;
}

/**
 * Conta de 0 até `value` em `duration`ms usando easing ease-out-cubic.
 * Respeita prefers-reduced-motion.
 */
export function AnimatedCounter({
  value,
  duration = 700,
  format,
  className = "",
}: Props) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Respeita reduced motion — aplica valor direto
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }

    const from = 0;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (value - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(value);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
