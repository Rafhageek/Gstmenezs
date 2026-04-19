interface EmConstrucaoProps {
  titulo: string;
  descricao: string;
  proximasFuncionalidades: string[];
}

export function EmConstrucao({
  titulo,
  descricao,
  proximasFuncionalidades,
}: EmConstrucaoProps) {
  return (
    <div>
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
          Em construção
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {titulo}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{descricao}</p>
      </header>

      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Próximas funcionalidades
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {proximasFuncionalidades.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]"
              />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-lg border border-[var(--border)] bg-black/30 p-4">
          <p className="text-xs text-[var(--muted)]">
            Esta página é um placeholder. O backend (schema, RLS, triggers)
            já está pronto — falta implementar a interface.
          </p>
        </div>
      </div>
    </div>
  );
}
