"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert, Badge } from "@/components/ui/feedback";
import { formatDataBR } from "@/lib/format";
import {
  registrarPasskey,
  isPasskeyAvailable,
} from "@/lib/passkey-client";
import { removerPasskey } from "./actions";
import type { Passkey } from "@/types/database";

interface Props {
  passkeys: Passkey[];
}

export function BiometriaManager({ passkeys }: Props) {
  const [suportado, setSuportado] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const [nomeDispositivo, setNomeDispositivo] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    isPasskeyAvailable().then(setSuportado);
  }, []);

  function onAtivar() {
    startTransition(async () => {
      const res = await registrarPasskey(nomeDispositivo);
      if (res.ok) {
        toast.success("Biometria cadastrada neste dispositivo");
        setShowForm(false);
        setNomeDispositivo("");
        // Recarrega para atualizar lista
        window.location.reload();
      } else {
        toast.error("Falha ao cadastrar", { description: res.error });
      }
    });
  }

  function onRemover(id: string, nome: string) {
    if (!confirm(`Remover biometria do ${nome}?`)) return;
    startTransition(async () => {
      const res = await removerPasskey(id);
      if (res.error) {
        toast.error("Erro ao remover", { description: res.error });
      } else {
        toast.success("Biometria removida");
      }
    });
  }

  if (suportado === null) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 text-sm text-[var(--muted)]">
        Verificando suporte à biometria...
      </div>
    );
  }

  if (!suportado) {
    return (
      <Alert variant="warning">
        Este dispositivo/navegador <strong>não suporta</strong> biometria para
        login (WebAuthn). Use o Chrome/Safari/Edge mais recentes em um
        aparelho com Face ID, Touch ID ou leitor de digital.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de dispositivos */}
      {passkeys.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Dispositivo</th>
                <th className="px-4 py-3 font-medium">Cadastrado em</th>
                <th className="px-4 py-3 font-medium">Último uso</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {passkeys.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className="px-4 py-3 font-medium">
                    {p.nome_dispositivo}
                    {p.backed_up && (
                      <Badge variant="neutral">sincronizado</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {formatDataBR(p.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {p.ultimo_uso_em
                      ? formatDataBR(p.ultimo_uso_em.slice(0, 10))
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {p.device_type ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRemover(p.id, p.nome_dispositivo)}
                      disabled={pending}
                    >
                      Remover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Alert variant="info">
          Nenhum dispositivo cadastrado ainda. Ative abaixo para usar
          biometria neste aparelho.
        </Alert>
      )}

      {/* Cadastrar novo */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>
          + Cadastrar biometria neste dispositivo
        </Button>
      ) : (
        <div className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-5 space-y-4">
          <div>
            <p className="text-sm font-medium">Nomeie este dispositivo</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Ajuda a identificar quando tiver mais de um aparelho cadastrado.
              Se deixar vazio, detectamos automaticamente.
            </p>
          </div>
          <Field label="Nome do dispositivo (opcional)">
            <Input
              value={nomeDispositivo}
              onChange={(e) => setNomeDispositivo(e.target.value)}
              placeholder="Ex.: iPhone 15 Pro"
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={onAtivar} disabled={pending}>
              {pending ? "Aguardando biometria..." : "Ativar Face ID / biometria"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
