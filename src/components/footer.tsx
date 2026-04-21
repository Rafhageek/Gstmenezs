import { getConfiguracoes } from "@/lib/configuracoes";

export async function Footer() {
  const config = await getConfiguracoes();
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)]/60 bg-[var(--background-elevated)]/40 px-4 py-5 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--muted)]/80">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-serif-brand text-xs font-medium text-[var(--gold)]/90">
            {config.razao_social}
          </span>
          {config.cnpj && (
            <span className="font-mono">CNPJ {config.cnpj}</span>
          )}
          {config.oab && <span>OAB {config.oab}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span>Sistema proprietário · Painel Financeiro v1.0</span>
          <span aria-hidden className="text-[var(--border)]">
            ·
          </span>
          <span>© {ano}</span>
        </div>
      </div>
    </footer>
  );
}
