"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "painelmnz:theme";

/**
 * Toggle de tema claro/escuro. Persiste em localStorage + seta atributo
 * data-theme no <html>. Script inline em layout.tsx aplica o tema antes
 * da hidratação (evita flash).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      } else {
        // Dark é o padrão do Painel MNZ (identidade jurídica)
        setTheme("dark");
      }
    } catch {
      /* ignore */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-theme", next);
  }

  // Evita flash de conteúdo diferente no SSR
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)]"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Mudar para tema ${theme === "dark" ? "claro" : "escuro"}`}
      title={`Tema ${theme === "dark" ? "escuro" : "claro"}`}
      className="group relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 hover:text-foreground"
    >
      <span
        className={`absolute transition-all duration-500 ${
          theme === "dark"
            ? "opacity-100 rotate-0"
            : "opacity-0 -rotate-90"
        }`}
      >
        <MoonIcon />
      </span>
      <span
        className={`absolute transition-all duration-500 ${
          theme === "light"
            ? "opacity-100 rotate-0"
            : "opacity-0 rotate-90"
        }`}
      >
        <SunIcon />
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
