"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Props {
  nome: string;
  tratamento: string;
  saudacao: string;
  escritorio: string;
  logo: ReactNode;
}

const REDIRECT_DELAY = 2800;

export function WelcomeSplash({
  nome,
  tratamento,
  saudacao,
  escritorio,
  logo,
}: Props) {
  const router = useRouter();
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const outTimer = setTimeout(() => setFadingOut(true), REDIRECT_DELAY - 400);
    const redirectTimer = setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, REDIRECT_DELAY);
    return () => {
      clearTimeout(outTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  const displayName = tratamento ? `${tratamento} ${nome}` : nome;

  return (
    <main
      className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <BackgroundAmbiente />
      <Particles />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="animate-pop-in">{logo}</div>

        <p className="animate-fade-in-up animate-delay-2 mt-8 text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          {saudacao}
        </p>

        <h1 className="animate-fade-in-up animate-delay-3 mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
          Bem-vindo,
        </h1>

        <h2 className="welcome-name mt-2 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          {displayName}
        </h2>

        <p className="animate-fade-in-up mt-6 text-sm text-[var(--muted)]" style={{ animationDelay: "700ms" }}>
          Ao seu painel de recebíveis
        </p>
        <p className="animate-fade-in-up text-xs uppercase tracking-[0.2em] text-[var(--gold)]" style={{ animationDelay: "850ms" }}>
          {escritorio}
        </p>

        <div
          className="mt-10 h-0.5 w-64 overflow-hidden rounded-full bg-[var(--border)]"
          aria-hidden
        >
          <div className="welcome-progress h-full bg-[var(--gold)]" />
        </div>

        <p className="mt-3 text-[11px] text-[var(--muted)]/70">
          Preparando seu painel...
        </p>
      </div>
    </main>
  );
}

function BackgroundAmbiente() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(900px circle at 20% 20%, rgba(201, 169, 97, 0.14), transparent 60%),
            radial-gradient(700px circle at 80% 80%, rgba(30, 58, 95, 0.5), transparent 60%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(201, 169, 97, 0.45) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
    </>
  );
}

/** Pequenos pontos dourados subindo devagar — vibe sutil, sem poluir. */
function Particles() {
  // Posições fixas para SSR-safe (não usar Math.random em render)
  const dots = [
    { left: "12%", delay: "0ms" },
    { left: "24%", delay: "400ms" },
    { left: "38%", delay: "800ms" },
    { left: "52%", delay: "200ms" },
    { left: "66%", delay: "600ms" },
    { left: "78%", delay: "1000ms" },
    { left: "88%", delay: "300ms" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((d, i) => (
        <span
          key={i}
          className="welcome-particle"
          style={{
            left: d.left,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}
