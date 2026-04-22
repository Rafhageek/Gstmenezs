"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/feedback";
import { formatBRL, formatDataBR } from "@/lib/format";
import {
  previewPlanilhaHistorico,
  importarPlanilhaHistorico,
  type PreviewResult,
} from "./actions";

interface Props {
  clientes: { id: string; nome: string; documento: string }[];
}

type Etapa = "upload" | "preview" | "concluido";

export function ImportadorPlanilha({ clientes }: Props) {
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [clienteId, setClienteId] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [resumoFinal, setResumoFinal] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    const fd = new FormData();
    for (const f of arquivos) fd.append("arquivos", f);

    startTransition(async () => {
      const res = await previewPlanilhaHistorico(fd);
      setPreview(res);
      setEtapa("preview");
      if (res.cessionarios.length === 0) {
        toast.error("Nenhum cessionário válido encontrado nos arquivos.");
      }
    });
  }

  function handleImportar() {
    if (!preview || !clienteId) return;
    if (preview.cessionarios.length === 0) return;

    const confirmacao = confirm(
      `Importar ${preview.cessionarios.length} cessionário(s) e ${preview.cessionarios.reduce(
        (s, c) => s + c.pagamentos.length,
        0,
      )} pagamento(s) para o cliente "${clienteSelecionado?.nome}"?`,
    );
    if (!confirmacao) return;

    startTransition(async () => {
      const res = await importarPlanilhaHistorico(
        clienteId,
        preview.cessionarios,
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
    const totalPagos = preview.cessionarios.reduce(
      (s, c) => s + c.pagamentos.length,
      0,
    );
    const somaValores = preview.cessionarios.reduce(
      (s, c) => s + c.totalRecebido,
      0,
    );
    return (
      <div className="space-y-4">
        <Alert variant="info">
          Cliente: <strong>{clienteSelecionado?.nome}</strong> · Arquivos
          válidos: <strong>{preview.cessionarios.length}</strong> ·{" "}
          Pagamentos: <strong>{totalPagos}</strong> · Total recebido:{" "}
          <strong>{formatBRL(somaValores)}</strong>
        </Alert>

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
                return (
                  <tr
                    key={i}
                    className={`border-t border-[var(--border)] ${i % 2 === 1 ? "bg-black/[0.08]" : ""}`}
                  >
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
            disabled={pending || preview.cessionarios.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? "Importando..."
              : `Confirmar e importar (${preview.cessionarios.length})`}
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
          disabled={pending || !clienteId || arquivos.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Processando..."
            : `Gerar preview (${arquivos.length || 0} arquivo${arquivos.length === 1 ? "" : "s"})`}
        </button>
      </div>
    </div>
  );
}
