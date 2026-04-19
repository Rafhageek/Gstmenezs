"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  analisarCSV,
  executarImportacao,
  type LinhaImport,
  type ImportState,
} from "./actions";
import { formatBRL } from "@/lib/format";

export function ImportWizard() {
  const [state, setState] = useState<ImportState>({ error: null });
  const [linhas, setLinhas] = useState<LinhaImport[]>([]);
  const [pending, startTransition] = useTransition();
  const [filename, setFilename] = useState<string>("");

  function onAnalisar(formData: FormData) {
    const file = formData.get("arquivo") as File;
    setFilename(file?.name ?? "");
    startTransition(async () => {
      const res = await analisarCSV(formData);
      setState(res);
      setLinhas(res.preview ?? []);
    });
  }

  function onImportar() {
    startTransition(async () => {
      const res = await executarImportacao(linhas);
      setState(res);
      if (res.importado) {
        toast.success(
          `${res.importado.sucesso} cessões importadas${
            res.importado.falhas.length
              ? ` · ${res.importado.falhas.length} falharam`
              : ""
          }`,
        );
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  }

  function resetar() {
    setState({ error: null });
    setLinhas([]);
    setFilename("");
  }

  // Resultado final
  if (state.importado) {
    const { sucesso, falhas } = state.importado;
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <strong>{sucesso} cessão{sucesso === 1 ? "" : "es"} importada{sucesso === 1 ? "" : "s"} com sucesso.</strong>
          {falhas.length > 0 && (
            <>
              {" "}
              <span>{falhas.length} linha{falhas.length === 1 ? "" : "s"} falharam.</span>
            </>
          )}
        </Alert>

        {falhas.length > 0 && (
          <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-[var(--danger)]">
              Linhas com falha
            </p>
            <ul className="space-y-1 text-xs">
              {falhas.map((f) => (
                <li key={f.linha} className="font-mono">
                  Linha {f.linha} ({f.numero_contrato}): {f.erro}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={resetar} variant="secondary">
          Nova importação
        </Button>
      </div>
    );
  }

  // Preview
  if (linhas.length > 0) {
    const comErro = linhas.filter((l) => l.erro);
    const validas = linhas.filter((l) => !l.erro);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <strong>{filename}</strong> · {linhas.length} linha
            {linhas.length === 1 ? "" : "s"}
            {comErro.length > 0 && (
              <>
                {" "}·{" "}
                <span className="text-[var(--danger)]">
                  {comErro.length} com erro
                </span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={resetar}>
              Cancelar
            </Button>
            <Button
              onClick={onImportar}
              disabled={pending || validas.length === 0}
            >
              {pending
                ? "Importando..."
                : `Importar ${validas.length} cessões`}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-black/60 text-left uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Linha</th>
                  <th className="px-3 py-2 font-medium">Contrato</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Cessionário</th>
                  <th className="px-3 py-2 font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium">Parcelas</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr
                    key={l.linha}
                    className={`border-t border-[var(--border)] ${
                      l.erro ? "bg-[var(--danger)]/10" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-[var(--muted)]">
                      {l.linha}
                    </td>
                    <td className="px-3 py-2 font-mono">{l.numero_contrato}</td>
                    <td className="px-3 py-2">{l.cliente_nome}</td>
                    <td className="px-3 py-2">{l.cessionario_nome}</td>
                    <td className="px-3 py-2 font-mono">
                      {formatBRL(l.valor_total)}
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {l.parcelas_total}
                    </td>
                    <td className="px-3 py-2">
                      {l.erro ? (
                        <span className="text-[var(--danger)]">{l.erro}</span>
                      ) : (
                        <span className="text-[var(--success)]">✓ OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Upload inicial
  return (
    <form action={onAnalisar} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Arquivo CSV
        </span>
        <input
          name="arquivo"
          type="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-[var(--gold)]/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--gold)] hover:file:bg-[var(--gold)]/30"
        />
      </label>

      {state.error && <Alert variant="danger">{state.error}</Alert>}

      <Button type="submit" disabled={pending}>
        {pending ? "Analisando..." : "Analisar CSV"}
      </Button>
    </form>
  );
}
