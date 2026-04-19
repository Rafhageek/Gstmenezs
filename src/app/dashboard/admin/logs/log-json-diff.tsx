"use client";

import { useMemo } from "react";

interface Props {
  anteriores: Record<string, unknown> | null;
  novos: Record<string, unknown> | null;
}

/**
 * Mostra um diff visual dos campos alterados.
 * - INSERT: lista todos os campos novos (verde).
 * - UPDATE: só os campos que mudaram (amarelo: antes → depois).
 * - DELETE: lista todos os campos do registro removido (vermelho).
 */
export function LogJsonDiff({ anteriores, novos }: Props) {
  const tipo = !anteriores ? "create" : !novos ? "delete" : "update";

  const campos = useMemo(() => {
    if (tipo === "create" && novos) {
      return Object.entries(novos).map(([k, v]) => ({
        chave: k,
        antes: undefined,
        depois: v,
        mudou: true,
      }));
    }
    if (tipo === "delete" && anteriores) {
      return Object.entries(anteriores).map(([k, v]) => ({
        chave: k,
        antes: v,
        depois: undefined,
        mudou: true,
      }));
    }
    if (anteriores && novos) {
      const todasChaves = new Set([
        ...Object.keys(anteriores),
        ...Object.keys(novos),
      ]);
      return Array.from(todasChaves)
        .map((k) => ({
          chave: k,
          antes: anteriores[k],
          depois: novos[k],
          mudou: JSON.stringify(anteriores[k]) !== JSON.stringify(novos[k]),
        }))
        .filter((c) => c.mudou);
    }
    return [];
  }, [anteriores, novos, tipo]);

  if (campos.length === 0) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Sem alterações registradas.
      </p>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead className="text-left text-[10px] uppercase tracking-wide text-[var(--muted)]">
        <tr>
          <th className="pb-2 pr-3 font-medium">Campo</th>
          {tipo !== "create" && (
            <th className="pb-2 pr-3 font-medium">Antes</th>
          )}
          {tipo !== "delete" && (
            <th className="pb-2 font-medium">Depois</th>
          )}
        </tr>
      </thead>
      <tbody>
        {campos.map((c) => (
          <tr key={c.chave} className="border-t border-[var(--border)]/50">
            <td className="py-2 pr-3 font-mono text-[11px] text-[var(--gold)]">
              {c.chave}
            </td>
            {tipo !== "create" && (
              <td className="py-2 pr-3 align-top font-mono text-[11px] text-[var(--danger)]/90 break-all">
                {formatValue(c.antes)}
              </td>
            )}
            {tipo !== "delete" && (
              <td className="py-2 align-top font-mono text-[11px] text-[var(--success)]/90 break-all">
                {formatValue(c.depois)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatValue(v: unknown): string {
  if (v === undefined) return "—";
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
