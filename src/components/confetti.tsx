"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Dispara quando vira true. Passa false depois pra resetar. */
  active: boolean;
  /** Duração em ms. */
  duration?: number;
  /** Quantidade de partículas. */
  count?: number;
}

/**
 * Confetti dourado discreto — sem dependências externas.
 * Usa CSS animations + 30 partículas DOM simples.
 * Respeita prefers-reduced-motion.
 */
export function Confetti({ active, duration = 1800, count = 30 }: Props) {
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (!active) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowing(true);
    const t = setTimeout(() => setShowing(false), duration);
    return () => clearTimeout(t);
  }, [active, duration]);

  if (!showing) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Particle key={i} index={i} total={count} duration={duration} />
      ))}
    </div>
  );
}

function Particle({
  index,
  total,
  duration,
}: {
  index: number;
  total: number;
  duration: number;
}) {
  // Distribuição determinística (sem Math.random em render SSR)
  const seed = (index * 9301 + 49297) % 233280;
  const rand = (offset = 0) => ((seed + offset) % 997) / 997;

  const leftStart = `${10 + rand(1) * 80}%`;
  const horizDrift = `${(rand(2) - 0.5) * 40}%`;
  const rotStart = `${rand(3) * 720 - 360}deg`;
  const rotEnd = `${rand(4) * 720 + 360}deg`;
  const delay = `${(index / total) * 250}ms`;
  const size = 6 + Math.floor(rand(5) * 6);
  const colorChoice = Math.floor(rand(6) * 3);
  const colors = ["#c9a961", "#f5d87a", "#d4b876"];
  const color = colors[colorChoice];
  const shape = rand(7) > 0.5 ? "9999px" : "2px";

  return (
    <span
      style={{
        position: "absolute",
        left: leftStart,
        top: "-10px",
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        borderRadius: shape,
        animation: `confetti-fall ${duration}ms cubic-bezier(0.25, 0.7, 0.5, 1) ${delay} forwards, confetti-spin ${duration}ms linear ${delay} forwards`,
        "--drift": horizDrift,
        "--rot-start": rotStart,
        "--rot-end": rotEnd,
        boxShadow: `0 0 6px ${color}66`,
      } as React.CSSProperties}
    />
  );
}
