"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  tipo: "cliente" | "cessionario" | "cessao";
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
}

const TIPO_LABEL: Record<SearchResult["tipo"], string> = {
  cliente: "CLI",
  cessionario: "CES",
  cessao: "CTR",
};

const TIPO_COLOR: Record<SearchResult["tipo"], string> = {
  cliente: "bg-[var(--gold)]/15 text-[var(--gold)]",
  cessionario: "bg-[var(--warning)]/15 text-[var(--warning)]",
  cessao: "bg-[var(--success)]/15 text-[var(--success)]",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Atalho ⌘K / Ctrl+K para abrir
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Foca o input ao abrir. Reset de state ao fechar é intencional.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      /* eslint-disable react-hooks/set-state-in-effect */
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  // Busca com debounce. Limpa resultados quando query < 2 chars.
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal },
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setActiveIndex(0);
        }
      } catch {
        /* abortado ou erro — silencioso */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  function navegar(res: SearchResult) {
    setOpen(false);
    router.push(res.href);
  }

  function onKeyDownInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      navegar(results[activeIndex]);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Abrir busca (Ctrl+K)"
        onClick={() => setOpen(true)}
        className="group hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-black/30 px-3 py-1.5 text-xs text-[var(--muted)] transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 hover:text-foreground md:inline-flex"
      >
        <span className="transition-colors group-hover:text-[var(--gold)]">
          <SearchIcon />
        </span>
        <span>Buscar...</span>
        <kbd className="rounded border border-[var(--border)] bg-black/40 px-1.5 font-mono text-[10px] transition-colors group-hover:border-[var(--gold)]/60 group-hover:text-[var(--gold)]">
          Ctrl K
        </kbd>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-20 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="animate-fade-in-up w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDownInput}
            placeholder="Buscar cliente, cessionário, contrato..."
            className="flex-1 bg-transparent py-4 text-sm text-foreground outline-none placeholder:text-[var(--muted)]/60"
          />
          {loading && (
            <span className="text-[10px] text-[var(--muted)]">...</span>
          )}
          <kbd className="hidden rounded border border-[var(--border)] bg-black/40 px-1.5 font-mono text-[10px] text-[var(--muted)] md:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">
              Digite ao menos 2 caracteres para buscar.
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">
              Nenhum resultado para <strong>&quot;{query}&quot;</strong>.
            </div>
          ) : (
            <ul role="listbox">
              {results.map((r, i) => (
                <li key={`${r.tipo}-${r.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => navegar(r)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      i === activeIndex
                        ? "bg-[var(--gold)]/10"
                        : "hover:bg-black/30"
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${TIPO_COLOR[r.tipo]}`}
                    >
                      {TIPO_LABEL[r.tipo]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.titulo}</p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {r.subtitulo}
                      </p>
                    </div>
                    {i === activeIndex && (
                      <span className="shrink-0 text-xs text-[var(--gold)]">
                        ↵
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-[var(--border)] bg-black/20 px-4 py-2 text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-[var(--border)] px-1">
                ↑↓
              </kbd>{" "}
              navegar
            </span>
            <span>
              <kbd className="rounded border border-[var(--border)] px-1">
                ↵
              </kbd>{" "}
              abrir
            </span>
          </span>
          <span>Busca global</span>
        </footer>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
