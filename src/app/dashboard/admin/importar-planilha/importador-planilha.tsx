"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/feedback";
import { formatBRL, formatDataBR } from "@/lib/format";
import {
  parsePlanilhaHistorico,
  type CessionarioHistorico,
} from "@/lib/planilha-historico-parser";
import { importarPlanilhaHistorico } from "./actions";

interface PreviewResult {
  total: number;
  cessionarios: (CessionarioHistorico & { avisos: string[] })[];
  erros: { arquivo: string; mensagem: string }[];
}

interface Props {
  clientes: { id: string; nome: string; documento: string }[];
}

type Etapa = "upload" | "preview" | "concluido";

export function ImportadorPlanilha({ clientes }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [clienteId, setClienteId] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [resumoFinal, setResumoFinal] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [parseando, setParseando] = useState(false);
  const [progresso, setProgresso] = useState<{ atual: number; total: number }>({
    atual: 0,
    total: 0,
  });

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);

  async function handlePreview() {
    if (!clienteId) {
      toast.error("Selecione o cliente cedente antes.");
      return;
    }
    if (arquivos.length === 0) {
      toast.error("Selecione pelo menos 1 arquivo HTML.");
      return;
    }

    // Parser roda NO NAVEGADOR — evita upload de MBs pro servidor
    setParseando(true);
    setProgresso({ atual: 0, total: arquivos.length });
    try {
      const previews: (CessionarioHistorico & { avisos: string[] })[] = [];
      const erros: { arquivo: string; mensagem: string }[] = [];

      for (let i = 0; i < arquivos.length; i++) {
        const file = arquivos[i];
        setProgresso({ atual: i + 1, total: arquivos.length });
        try {
          const html = await file.text();
          const { cessionario, avisos } = parsePlanilhaHistorico(
            html,
            file.name,
          );
          if (!cessionario) {
            erros.push({
              arquivo: file.name,
              mensagem: avisos[0] ?? "Falha ao parsear.",
            });
            continue;
          }
          // Pula apenas arquivos de resumo que não representam cessionários
          if (/^resumo/i.test(file.name) || /^mov\s+mes/i.test(file.name)) {
            erros.push({
              arquivo: file.name,
              mensagem: "Arquivo de resumo (pulado)",
            });
            continue;
          }
          // Aceita cessionário mesmo sem pagamentos (será criado como "ativa sem movimento")
          if (cessionario.pagamentos.length === 0) {
            previews.push({
              ...cessionario,
              avisos: [...avisos, "Sem pagamentos registrados — será criado como ativa sem movimento"],
            });
          } else {
            previews.push({ ...cessionario, avisos });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          erros.push({ arquivo: file.name, mensagem: msg });
        }
        // Yield para a UI atualizar o progresso
        await new Promise((r) => setTimeout(r, 0));
      }

      const res: PreviewResult = {
        total: previews.length,
        cessionarios: previews,
        erros,
      };
      setPreview(res);
      // Por padrão, pré-seleciona todos
      setSelecionados(new Set(previews.map((_, i) => i)));
      setEtapa("preview");
      if (res.cessionarios.length === 0) {
        toast.error("Nenhum cessionário válido encontrado nos arquivos.");
      }
    } finally {
      setParseando(false);
    }
  }

  function toggleSelecionado(idx: number) {
    setSelecionados((prev) => {
      const nova = new Set(prev);
      if (nova.has(idx)) nova.delete(idx);
      else nova.add(idx);
      return nova;
    });
  }

  function selecionarTodos() {
    if (!preview) return;
    setSelecionados(new Set(preview.cessionarios.map((_, i) => i)));
  }

  function desmarcarTodos() {
    setSelecionados(new Set());
  }

  /** Pré-seleção inteligente: só cessionários cujo último pagamento é em 2025 ou 2026 */
  function selecionarAtivos() {
    if (!preview) return;
    const nova = new Set<number>();
    preview.cessionarios.forEach((c, i) => {
      const ultima = c.pagamentos[c.pagamentos.length - 1]?.data ?? "";
      if (ultima.startsWith("2025") || ultima.startsWith("2026")) nova.add(i);
    });
    setSelecionados(nova);
  }

  function handleImportar() {
    if (!preview || !clienteId) return;
    const cessionariosFinal = preview.cessionarios.filter((_, i) =>
      selecionados.has(i),
    );
    if (cessionariosFinal.length === 0) {
      toast.error("Selecione ao menos 1 cessionário para importar.");
      return;
    }

    const confirmacao = confirm(
      `Importar ${cessionariosFinal.length} cessionário(s) e ${cessionariosFinal.reduce(
        (s, c) => s + c.pagamentos.length,
        0,
      )} pagamento(s) para o cliente "${clienteSelecionado?.nome}"?`,
    );
    if (!confirmacao) return;

    startTransition(async () => {
      const res = await importarPlanilhaHistorico(
        clienteId,
        cessionariosFinal,
      );
      if (res.falhas.length > 0) {
        toast.error(`${res.falhas.length} cessionário(s) falharam`, {
          description: res.falhas
            .slice(0, 3)
            .map((f) => `• ${f.cessionario}: ${f.motivo}`)
            .join("\n"),
          duration: 15000,
        });
      }
      if (res.cessionariosCriados > 0) {
        toast.success(
          `Importação concluída: ${res.cessionariosCriados} cessionários, ${res.pagamentosCriados} pagamentos`,
        );
      }
      setResumoFinal(
        `✓ ${res.cessionariosCriados} cessionários criados\n` +
          `✓ ${res.cessoesCriadas} cessões criadas\n` +
          `✓ ${res.pagamentosCriados} pagamentos registrados` +
          (res.falhas.length
            ? `\n\n✗ ${res.falhas.length} falharam:\n${res.falhas.map((f) => `  • ${f.cessionario}: ${f.motivo}`).join("\n")}`
            : ""),
      );
      setEtapa("concluido");
    });
  }

  function reset() {
    setEtapa("upload");
    setArquivos([]);
    setPreview(null);
    setResumoFinal(null);
  }

  // ==================================================================
  // ETAPA: CONCLUIDO
  // ==================================================================
  if (etapa === "concluido" && resumoFinal) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <strong>Importação concluída</strong>
          <pre className="mt-2 whitespace-pre-wrap text-xs">{resumoFinal}</pre>
        </Alert>
        <div className="flex gap-3">
          <a
            href={`/dashboard/clientes/${clienteId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] hover:bg-[var(--gold-hover)]"
          >
            Ver cessões do cliente →
          </a>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm"
          >
            Nova importação
          </button>
        </div>
      </div>
    );
  }

  // ==================================================================
  // ETAPA: PREVIEW
  // ==================================================================
  if (etapa === "preview" && preview) {
    const selecionadosList = preview.cessionarios.filter((_, i) =>
      selecionados.has(i),
    );
    const totalPagosSel = selecionadosList.reduce(
      (s, c) => s + c.pagamentos.length,
      0,
    );
    const somaValoresSel = selecionadosList.reduce(
      (s, c) => s + c.totalRecebido,
      0,
    );
    const somaInicialSel = selecionadosList.reduce(
      (s, c) => s + c.saldoInicial,
      0,
    );
    return (
      <div className="space-y-4">
        <Alert variant="info">
          Cliente: <strong>{clienteSelecionado?.nome}</strong> ·{" "}
          Selecionados:{" "}
          <strong>
            {selecionadosList.length} de {preview.cessionarios.length}
          </strong>{" "}
          · Pagamentos: <strong>{totalPagosSel}</strong> · Volume total:{" "}
          <strong>{formatBRL(somaInicialSel)}</strong> · Recebido:{" "}
          <strong>{formatBRL(somaValoresSel)}</strong>
        </Alert>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-black/20 p-3">
          <span className="text-xs text-[var(--muted)]">Selecionar:</span>
          <button
            type="button"
            onClick={selecionarTodos}
            className="rounded-md border border-[var(--border)] bg-black/20 px-3 py-1 text-xs text-foreground transition-colors hover:border-[var(--gold)]/50"
          >
            Todos ({preview.cessionarios.length})
          </button>
          <button
            type="button"
            onClick={selecionarAtivos}
            title="Só cessionários com último pagamento em 2025 ou 2026"
            className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs text-[var(--gold)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold)]/20"
          >
            Apenas ativos 2025/2026
          </button>
          <button
            type="button"
            onClick={desmarcarTodos}
            className="rounded-md border border-[var(--border)] bg-black/20 px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:text-foreground"
          >
            Desmarcar todos
          </button>
        </div>

        {preview.erros.length > 0 && (
          <details className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/5 p-3">
            <summary className="cursor-pointer text-xs text-[var(--warning)]">
              {preview.erros.length} arquivo(s) ignorado(s)
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
              {preview.erros.map((e, i) => (
                <li key={i}>
                  <code className="font-mono">{e.arquivo}</code>: {e.mensagem}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="w-12 px-4 py-3 font-medium"></th>
                <th className="px-4 py-3 font-medium">Cessionário</th>
                <th className="px-4 py-3 font-medium">% cedida</th>
                <th className="px-4 py-3 text-right font-medium">
                  Valor inicial
                </th>
                <th className="px-4 py-3 text-right font-medium">Recebido</th>
                <th className="px-4 py-3 font-medium">Pagamentos</th>
                <th className="px-4 py-3 font-medium">Período</th>
              </tr>
            </thead>
            <tbody>
              {preview.cessionarios.map((c, i) => {
                const primeira = c.pagamentos[0]?.data;
                const ultima = c.pagamentos[c.pagamentos.length - 1]?.data;
                const marcado = selecionados.has(i);
                return (
                  <tr
                    key={i}
                    className={`border-t border-[var(--border)] transition-colors ${
                      marcado
                        ? ""
                        : "opacity-40"
                    } ${i % 2 === 1 ? "bg-black/[0.08]" : ""}`}
                  >
                    <td className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggleSelecionado(i)}
                        aria-label={`Selecionar ${c.nome}`}
                        className="h-4 w-4 cursor-pointer rounded border-[var(--border)] bg-black/30 accent-[var(--gold)]"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {c.nome}
                      {c.avisos.length > 0 && (
                        <div className="mt-0.5 text-[10px] text-[var(--warning)]">
                          ⚠ {c.avisos.join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {c.percentualCedido != null
                        ? `${Number(c.percentualCedido).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {formatBRL(c.saldoInicial)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[var(--success)]">
                      {formatBRL(c.totalRecebido)}
                    </td>
                    <td className="px-4 py-3">{c.pagamentos.length}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted)]">
                      {primeira ? formatDataBR(primeira) : "—"}
                      {ultima && ultima !== primeira
                        ? ` → ${formatDataBR(ultima)}`
                        : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleImportar}
            disabled={pending || selecionados.size === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? "Importando..."
              : `Confirmar e importar (${selecionados.size})`}
          </button>
          <button
            type="button"
            onClick={() => setEtapa("upload")}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm hover:border-[var(--gold)]"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  // ==================================================================
  // ETAPA: UPLOAD
  // ==================================================================
  return (
    <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6">
      {/* Passo 1 */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Passo 1 — Cliente cedente
        </label>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2 text-sm text-foreground focus:border-[var(--gold)] focus:outline-none"
        >
          <option value="">Selecione o cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        {clientes.length === 0 && (
          <p className="mt-2 text-xs text-[var(--warning)]">
            Nenhum cliente cadastrado. Cadastre o cliente primeiro em Clientes →
            Novo cliente.
          </p>
        )}
      </div>

      {/* Passo 2 */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Passo 2 — Arquivos HTML (um por cessionário)
        </label>
        <input
          type="file"
          multiple
          accept=".html,.htm"
          onChange={(e) => setArquivos(Array.from(e.target.files ?? []))}
          className="block w-full cursor-pointer rounded-lg border border-dashed border-[var(--border)] bg-black/20 p-6 text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--gold)]/20 file:px-3 file:py-1.5 file:text-[var(--gold)] hover:border-[var(--gold)]/60 hover:file:bg-[var(--gold)]/30"
        />
        {arquivos.length > 0 && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {arquivos.length} arquivo(s) selecionado(s)
          </p>
        )}
      </div>

      {/* Ação */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handlePreview}
          disabled={parseando || pending || !clienteId || arquivos.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {parseando
            ? `Analisando ${progresso.atual} de ${progresso.total}...`
            : `Gerar preview (${arquivos.length || 0} arquivo${arquivos.length === 1 ? "" : "s"})`}
        </button>
      </div>
    </div>
  );
}
