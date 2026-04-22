/**
 * Utilitários client-side para upload de comprovantes:
 * - Validação de tamanho (<=5 MB)
 * - Compressão automática de imagens grandes (>1 MB) para JPEG 1600px max
 * - Lista de MIME types aceitos
 */

export const MAX_COMPROVANTE_BYTES = 5 * 1024 * 1024; // 5 MB
export const TAMANHO_MAX_MB = 5;
export const COMPRIMIR_ACIMA_DE_BYTES = 1 * 1024 * 1024; // comprime se > 1 MB

export const TIPOS_ACEITOS_ACCEPT =
  "application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif";

export const TIPOS_ACEITOS = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export function isImagem(file: File | Blob): boolean {
  return file.type.startsWith("image/");
}

export function isPdf(file: File | Blob): boolean {
  return file.type === "application/pdf";
}

/** Converte bytes pra string legível. */
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Valida o arquivo antes do upload.
 * Retorna null se OK, mensagem de erro se inválido.
 */
export function validarComprovante(file: File): string | null {
  if (file.size === 0) return "Arquivo vazio.";
  if (file.size > MAX_COMPROVANTE_BYTES) {
    return `Arquivo muito grande (${formatarTamanho(file.size)}). Máximo: ${TAMANHO_MAX_MB} MB.`;
  }
  if (file.type && !TIPOS_ACEITOS.includes(file.type)) {
    return `Tipo não suportado (${file.type}). Use PDF, JPG, PNG, WEBP ou HEIC.`;
  }
  return null;
}

/**
 * Comprime uma imagem se ela for maior que 1 MB.
 * Redimensiona pra max 1600px no lado maior, qualidade 0.85, JPEG.
 * Retorna o File original se:
 * - não for imagem
 * - for menor que 1 MB
 * - ambiente não suportar canvas (SSR)
 */
export async function comprimirSeNecessario(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!isImagem(file)) return file;
  if (file.size <= COMPRIMIR_ACIMA_DE_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const MAX_LADO = 1600;
    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) return file;

    // Se comprimido ficou maior que o original (raro), devolve o original
    if (blob.size >= file.size) return file;

    const novoNome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], novoNome, { type: "image/jpeg" });
  } catch {
    // Qualquer erro cai pra versão original (não compromete o fluxo)
    return file;
  }
}
