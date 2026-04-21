"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  source?: "local" | "gemini";
}

const SUGESTOES = [
  "Quanto tenho a receber?",
  "Como cadastro um cessionário?",
  "Tem cliente inadimplente?",
  "O que é % cedida?",
];

export function AssistenteWidget() {
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens, loading]);

  async function enviar(textoDireto?: string) {
    const texto = (textoDireto ?? input).trim();
    if (!texto || loading) return;

    setErro(null);
    setInput("");
    const novas: Msg[] = [...mensagens, { role: "user", content: texto }];
    setMensagens(novas);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: novas }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        source?: "local" | "gemini";
      };
      if (!res.ok || data.error) {
        setErro(data.error ?? "Erro ao consultar o assistente.");
        setMensagens(novas); // sem resposta
      } else if (data.reply) {
        setMensagens([
          ...novas,
          { role: "assistant", content: data.reply, source: data.source },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha de rede";
      setErro(msg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--gold)]/30 bg-[var(--background-elevated)]">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--gold)]"
          aria-hidden
        />
        <h3 className="text-sm font-semibold">Assistente</h3>
        <span className="ml-auto text-[10px] text-[var(--muted)]">
          Local + Gemini
        </span>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 text-sm"
        style={{ maxHeight: 420, minHeight: 260 }}
      >
        {mensagens.length === 0 && (
          <div className="space-y-3">
            <p className="text-[var(--muted)]">
              Olá! Sou o assistente do Painel Financeiro. Pergunte qualquer coisa
              sobre cessões, cessionários, pagamentos ou como usar o sistema.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="rounded-full border border-[var(--border)] bg-black/30 px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--gold)] hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-[var(--gold)]/15 text-foreground"
                  : "bg-black/30 text-foreground"
              }`}
            >
              {m.content}
              {m.role === "assistant" && m.source === "gemini" && (
                <div className="mt-1.5 text-[9px] uppercase tracking-wider text-[var(--muted)]/70">
                  ✦ via Gemini
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-black/30 px-3 py-2 text-sm text-[var(--muted)]">
              <span className="inline-flex gap-1">
                <span className="animate-pulse">●</span>
                <span
                  className="animate-pulse"
                  style={{ animationDelay: "120ms" }}
                >
                  ●
                </span>
                <span
                  className="animate-pulse"
                  style={{ animationDelay: "240ms" }}
                >
                  ●
                </span>
              </span>
            </div>
          </div>
        )}

        {erro && (
          <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
            {erro}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
        className="flex items-end gap-2 border-t border-[var(--border)] p-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pergunte algo..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2 text-sm text-foreground outline-none placeholder:text-[var(--muted)]/60 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
