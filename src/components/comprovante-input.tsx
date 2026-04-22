"use client";

import { useEffect, useRef, useState } from "react";
import {
  TIPOS_ACEITOS_ACCEPT,
  validarComprovante,
  comprimirSeNecessario,
  formatarTamanho,
  isImagem,
  isPdf,
} from "@/lib/comprovantes";

interface Props {
  /** Callback com o arquivo já validado (e comprimido se aplicável). null quando limpo. */
  onChange: (file: File | null) => void;
  /** Nome do input (vai parar no FormData). */
  name?: string;
  /** Desabilita o input (ex.: enquanto submete). */
  disabled?: boolean;
}

/**
 * Input de comprovante reutilizável:
 * - Validação de tamanho (max 5 MB) e tipo (PDF/JPG/PNG/WEBP/HEIC)
 * - Compressão automática de imagens > 1 MB
 * - Preview em miniatura para imagens
 * - Indicador "PDF" para PDFs
 */
export function ComprovanteInput({
  onChange,
  name = "comprovante",
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [infoCompressao, setInfoCompressao] = useState<string | null>(null);

  useEffect(() => {
    if (!arquivo) {
      setPreviewUrl(null);
      return;
    }
    if (isImagem(arquivo)) {
      const url = URL.createObjectURL(arquivo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [arquivo]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0] ?? null;
    setErro(null);
    setInfoCompressao(null);
    if (!original) {
      setArquivo(null);
      onChange(null);
      return;
    }

    const errInicial = validarComprovante(original);
    if (errInicial) {
      setErro(errInicial);
      setArquivo(null);
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setProcessando(true);
    try {
      const processado = await comprimirSeNecessario(original);
      // Re-valida depois da compressão (por segurança)
      const errFinal = validarComprovante(processado);
      if (errFinal) {
        setErro(errFinal);
        setArquivo(null);
        onChange(null);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      if (processado !== original) {
        const economia = original.size - processado.size;
        setInfoCompressao(
          `Imagem otimizada: ${formatarTamanho(original.size)} → ${formatarTamanho(processado.size)} (−${formatarTamanho(economia)})`,
        );
        // Reflete o arquivo comprimido no input nativo pra que o FormData
        // enviado pelo form do pai use a versão otimizada.
        try {
          const dt = new DataTransfer();
          dt.items.add(processado);
          if (inputRef.current) inputRef.current.files = dt.files;
        } catch {
          /* DataTransfer pode falhar em browsers antigos — cai pra original */
        }
      }
      setArquivo(processado);
      onChange(processado);
    } finally {
      setProcessando(false);
    }
  }

  function limpar() {
    setArquivo(null);
    setErro(null);
    setInfoCompressao(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={TIPOS_ACEITOS_ACCEPT}
        disabled={disabled || processando}
        onChange={handleFileChange}
        className="block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-[var(--gold)]/20 file:px-3 file:py-1.5 file:text-[var(--gold)] hover:file:bg-[var(--gold)]/30 disabled:cursor-not-allowed disabled:opacity-60"
      />

      {processando && (
        <p className="text-xs text-[var(--muted)]">
          Otimizando imagem...
        </p>
      )}

      {erro && (
        <p className="rounded border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-2 py-1 text-xs text-[var(--danger)]">
          {erro}
        </p>
      )}

      {arquivo && !erro && (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-black/20 p-2">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview do comprovante"
              className="h-16 w-16 rounded object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-[var(--gold)]/10 text-xs font-mono font-semibold text-[var(--gold)]">
              {isPdf(arquivo) ? "PDF" : "FILE"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" title={arquivo.name}>
              {arquivo.name}
            </p>
            <p className="text-[10px] text-[var(--muted)]">
              {formatarTamanho(arquivo.size)} · {arquivo.type || "arquivo"}
            </p>
            {infoCompressao && (
              <p className="mt-1 text-[10px] text-[var(--success)]">
                {infoCompressao}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={limpar}
            disabled={disabled}
            className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--danger)]"
            title="Remover seleção"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
