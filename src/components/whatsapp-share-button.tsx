"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  /** URL interna/externa do PDF a ser compartilhado. */
  pdfUrl: string;
  /** Nome sugerido do arquivo (sem extensão necessariamente). */
  filename: string;
  /** Mensagem pré-preenchida para acompanhar o arquivo. */
  mensagem: string;
  /** Telefone opcional pré-preenchido (só números, com DDD e DDI). Ex.: 5511999999999 */
  telefone?: string;
  /** Tamanho do botão. */
  size?: "sm" | "md";
  /** Texto alternativo do botão (padrão "WhatsApp"). */
  label?: string;
  className?: string;
}

/**
 * Botão de compartilhar no WhatsApp com 2 estratégias:
 *
 * 1. **Web Share API Level 2 (files)** — em iOS 15+ e Android Chrome 93+
 *    o sistema abre o sheet nativo com WhatsApp, Email, etc. como opção.
 *    O PDF vai como anexo.
 *
 * 2. **Fallback wa.me** — em desktops e browsers antigos, baixa o PDF
 *    localmente (toast informa) e abre WhatsApp Web/app com mensagem
 *    pré-preenchida. Usuário anexa o arquivo manualmente.
 */
export function WhatsAppShareButton({
  pdfUrl,
  filename,
  mensagem,
  telefone,
  size = "md",
  label = "WhatsApp",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function compartilhar() {
    setLoading(true);
    try {
      // Tenta Web Share API (ideal em mobile)
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          const res = await fetch(pdfUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const nomeFinal = filename.endsWith(".pdf")
            ? filename
            : `${filename}.pdf`;
          const file = new File([blob], nomeFinal, {
            type: "application/pdf",
          });

          const podeCompartilharArquivo =
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] });

          if (podeCompartilharArquivo) {
            await navigator.share({
              files: [file],
              title: filename,
              text: mensagem,
            });
            return;
          }
        } catch (err) {
          // Share cancelado ou erro — cai no fallback
          if (err instanceof DOMException && err.name === "AbortError") {
            return; // cancelado pelo usuário, silencioso
          }
        }
      }

      // Fallback: baixa PDF + abre wa.me com mensagem
      await baixarPdf(pdfUrl, filename);
      const textoCompleto = `${mensagem}\n\n(O relatório foi baixado no seu dispositivo — anexe-o nesta conversa.)`;
      const params = new URLSearchParams({ text: textoCompleto });
      const waUrl = telefone
        ? `https://wa.me/${telefone}?${params.toString()}`
        : `https://wa.me/?${params.toString()}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      toast.success("PDF baixado — anexe no WhatsApp aberto");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao compartilhar";
      toast.error("Falha ao compartilhar", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs gap-1.5"
      : "px-4 py-2 text-xs gap-2";

  return (
    <button
      type="button"
      onClick={compartilhar}
      disabled={loading}
      className={`group inline-flex items-center justify-center rounded-lg font-semibold text-white transition-all duration-200 disabled:cursor-wait disabled:opacity-70 ${sizeClasses} ${className}`}
      style={{
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        boxShadow: "0 2px 8px rgba(37, 211, 102, 0.25)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 4px 14px rgba(37, 211, 102, 0.45)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 2px 8px rgba(37, 211, 102, 0.25)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      aria-label="Compartilhar PDF no WhatsApp"
    >
      <WhatsAppIcon size={size === "sm" ? 14 : 16} />
      <span>{loading ? "Preparando..." : label}</span>
    </button>
  );
}

async function baixarPdf(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const nomeFinal = filename.endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeFinal;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  } catch {
    // Se falhar download programático, abre o PDF em nova aba — usuário
    // pode baixar manualmente.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
