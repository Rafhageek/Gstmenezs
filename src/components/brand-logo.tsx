import Image from "next/image";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface Props {
  size?: number;
}

/**
 * Logotipo Menezes Advocacia.
 *
 * Tenta usar `/public/logo.png` se existir; caso contrário, exibe
 * o "M" estilizado em caixa azul marinho com borda dourada.
 *
 * Para personalizar: salve a logo em `public/logo.png` (idealmente
 * quadrada, fundo transparente, mínimo 64x64px).
 */
export function BrandLogo({ size = 32 }: Props) {
  const logoPath = join(process.cwd(), "public", "logo.png");
  const hasCustom = existsSync(logoPath);

  if (hasCustom) {
    return (
      <Image
        src="/logo.png"
        alt="Menezes Advocacia"
        width={size}
        height={size}
        className="rounded-md"
        priority
      />
    );
  }

  const fontSize = Math.round(size * 0.5);
  return (
    <div
      className="flex items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--background)]"
      style={{ width: size, height: size }}
    >
      <span
        className="font-mono font-semibold text-[var(--gold)]"
        style={{ fontSize }}
      >
        M
      </span>
    </div>
  );
}
