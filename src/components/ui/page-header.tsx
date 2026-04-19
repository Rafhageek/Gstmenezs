import Link from "next/link";

interface PageHeaderProps {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  acao?: {
    label: string;
    href: string;
  };
}

export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  acao,
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
      {acao && (
        <Link
          href={acao.href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)]"
        >
          {acao.label}
        </Link>
      )}
    </header>
  );
}
