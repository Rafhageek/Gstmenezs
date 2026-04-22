"use client";

import { useEffect, useRef, useState } from "react";

export interface StyledSelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: StyledSelectOption[];
  /** Texto mostrado quando value está vazio. */
  placeholder?: string;
  /** Largura mínima do botão (ex: "w-28", "w-32"). */
  widthClass?: string;
  /** ARIA label (acessibilidade). */
  ariaLabel?: string;
}

/**
 * Select estilizado consistente com o visual do Painel Financeiro.
 * Substitui o <select> nativo (que não aceita customização cross-browser).
 *
 * Features:
 * - Click outside fecha
 * - Escape fecha
 * - Setas ↑↓ navegam opções, Enter seleciona
 * - Check no item selecionado
 * - Animação fade-in-up (mesma do NavDropdown)
 */
export function StyledSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  widthClass = "min-w-[120px]",
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState<number>(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selecionado = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    function onClickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightIdx(-1);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setHighlightIdx(-1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(options.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter" && highlightIdx >= 0) {
        e.preventDefault();
        const opt = options[highlightIdx];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
          setHighlightIdx(-1);
        }
      }
    }

    document.addEventListener("click", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, highlightIdx, options, onChange]);

  // Scroll pra manter item destacado visível
  useEffect(() => {
    if (!open || highlightIdx < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightIdx] as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx, open]);

  function abrir() {
    setOpen(true);
    // Destaca o selecionado ao abrir (ou o 1º)
    const idx = options.findIndex((o) => o.value === value);
    setHighlightIdx(idx >= 0 ? idx : 0);
  }

  function selecionar(opt: StyledSelectOption) {
    onChange(opt.value);
    setOpen(false);
    setHighlightIdx(-1);
  }

  return (
    <div ref={ref} className={`relative ${widthClass}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : abrir())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-black/30 px-3 py-1.5 text-sm text-foreground transition-all ${
          open
            ? "border-[var(--gold)] ring-1 ring-[var(--gold)]/40"
            : "border-[var(--border)] hover:border-[var(--gold)]/60"
        }`}
      >
        <span
          className={selecionado ? "text-foreground" : "text-[var(--muted)]"}
        >
          {selecionado?.label ?? placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180 text-[var(--gold)]" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="animate-fade-in-up absolute left-0 top-full z-50 mt-1.5 w-full min-w-[160px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] shadow-2xl shadow-black/60"
          role="listbox"
        >
          <ul
            ref={listRef}
            className="max-h-[260px] overflow-y-auto py-1 text-sm"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlightIdx;
              return (
                <li
                  key={opt.value || `_empty_${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIdx(i)}
                  onClick={() => selecionar(opt)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 transition-colors ${
                    isHighlighted
                      ? "bg-[var(--gold)]/15 text-foreground"
                      : isSelected
                        ? "text-[var(--gold)]"
                        : "text-foreground"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      className="text-[var(--gold)]"
                      aria-hidden
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
