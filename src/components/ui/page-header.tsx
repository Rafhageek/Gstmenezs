import Link from "next/link";

interface AcaoHeader {
  label: string;
  href: string;
}

interface PageHeaderProps {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  /** Ação principal (botão dourado preenchido). */
  acao?: AcaoHeader;
  /** Ação secundária (botão com borda dourada). */
  acaoSecundaria?: AcaoHeader;
}

export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  acao,
  acaoSecundaria,
}: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && (
          <p className="mt-2 text-sm text-[var(--muted)]">{descricao}</p>
        )}
      </div>
      {(acao || acaoSecundaria) && (
        <div className="flex flex-wrap items-center gap-3">
          {acaoSecundaria && (
            <Link
              href={acaoSecundaria.href}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--gold)]/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--gold)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
            >
              {acaoSecundaria.label}
            </Link>
          )}
          {acao && (
            <Link
              href={acao.href}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)]"
            >
              {acao.label}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
