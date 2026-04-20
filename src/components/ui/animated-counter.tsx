"use client";

import { useEffect, useRef, useState } from "react";
import { formatBRL } from "@/lib/format";

type Formato = "brl" | "number" | "percent";

interface Props {
  /** Valor final (pode ser negativo). */
  value: number;
  /** Duração da animação em ms. */
  duration?: number;
  /** Formato do display. */
  format?: Formato;
  className?: string;
}

/**
 * Conta de 0 até `value` em `duration`ms usando easing ease-out-cubic.
 * Respeita prefers-reduced-motion.
 *
 * Recebe o formato como string (não função) para ser compatível com
 * Server Components que passam props serializáveis.
 */
export function AnimatedCounter({
  value,
  duration = 700,
  format = "brl",
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

  return <span className={className}>{formatValue(display, format)}</span>;
}

function formatValue(v: number, format: Formato): string {
  if (format === "brl") return formatBRL(v);
  if (format === "percent") return `${v.toFixed(1)}%`;
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(v);
}
