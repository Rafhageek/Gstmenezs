import Link from "next/link";

interface Props {
  /** Nome do "tipo" vazio: "clientes", "cessões", "pagamentos", "logs", etc. */
  tipo?: "clientes" | "cessionarios" | "cessoes" | "pagamentos" | "logs" | "agenda" | "usuarios" | "portal" | "parcelas" | "generic";
  titulo?: string;
  descricao?: string;
  /** CTA principal (link). */
  acao?: { label: string; href: string };
  /** CTA secundária (link ou texto). */
  acaoSecundaria?: { label: string; href: string };
  compact?: boolean;
}

const PRESETS: Record<
  NonNullable<Props["tipo"]>,
  {
    icon: React.ReactNode;
    titulo: string;
    descricao: string;
    acao?: { label: string; href: string };
  }
> = {
  clientes: {
    icon: <IconUsers />,
    titulo: "Nenhum cliente cadastrado",
    descricao:
      "Comece cadastrando o cliente principal cedente do crédito. Os cessionários vêm depois.",
    acao: { label: "+ Cadastrar cliente", href: "/dashboard/clientes/novo" },
  },
  cessionarios: {
    icon: <IconUsers />,
    titulo: "Nenhum cessionário cadastrado",
    descricao:
      "Cessionários são quem recebe o crédito. Cadastre um para criar uma cessão.",
    acao: {
      label: "+ Cadastrar cessionário",
      href: "/dashboard/cessionarios/novo",
    },
  },
  cessoes: {
    icon: <IconDocument />,
    titulo: "Nenhuma cessão cadastrada",
    descricao:
      "Crie seu primeiro contrato de cessão de crédito. O sistema gera as parcelas automaticamente.",
    acao: { label: "+ Nova cessão", href: "/dashboard/cessoes/nova" },
  },
  pagamentos: {
    icon: <IconCoin />,
    titulo: "Nenhum pagamento registrado",
    descricao:
      "Quando você cadastrar uma cessão, as parcelas aparecerão aqui para serem marcadas como pagas.",
  },
  parcelas: {
    icon: <IconCalendar />,
    titulo: "Nenhuma parcela gerada",
    descricao: "Esta cessão ainda não tem parcelas.",
  },
  agenda: {
    icon: <IconCalendar />,
    titulo: "Nada vencendo neste mês",
    descricao:
      "Não há parcelas previstas para este mês. Use as setas para navegar entre meses.",
  },
  logs: {
    icon: <IconShield />,
    titulo: "Nenhum log encontrado",
    descricao:
      "Ainda não há registros com esses filtros. Tente ampliar o período ou limpar os filtros.",
  },
  usuarios: {
    icon: <IconUsers />,
    titulo: "Nenhum usuário no sistema",
    descricao: "Crie o primeiro usuário para começar a equipe.",
    acao: { label: "+ Novo usuário", href: "/dashboard/admin/usuarios/novo" },
  },
  portal: {
    icon: <IconLink />,
    titulo: "Nenhum link do portal criado",
    descricao:
      "Gere um link compartilhável para um contador acessar dados de um cliente específico, sem login.",
  },
  generic: {
    icon: <IconInbox />,
    titulo: "Nada por aqui ainda",
    descricao: "Não há registros para exibir no momento.",
  },
};

export function EmptyState({
  tipo = "generic",
  titulo,
  descricao,
  acao,
  acaoSecundaria,
  compact = false,
}: Props) {
  const preset = PRESETS[tipo];
  const _titulo = titulo ?? preset.titulo;
  const _descricao = descricao ?? preset.descricao;
  const _acao = acao ?? preset.acao;

  return (
    <div
      className={`rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-elevated)]/40 text-center ${
        compact ? "p-6" : "p-10"
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-center rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/5 text-[var(--gold)] ${
          compact ? "h-10 w-10" : "h-14 w-14"
        }`}
      >
        {preset.icon}
      </div>
      <h3
        className={`mt-4 font-semibold tracking-tight ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        {_titulo}
      </h3>
      <p
        className={`mx-auto mt-2 max-w-md text-[var(--muted)] ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {_descricao}
      </p>
      {(_acao || acaoSecundaria) && (
        <div
          className={`flex flex-wrap items-center justify-center gap-3 ${
            compact ? "mt-4" : "mt-6"
          }`}
        >
          {_acao && (
            <Link
              href={_acao.href}
              className="rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--background)] transition-colors hover:bg-[var(--gold-hover)]"
            >
              {_acao.label}
            </Link>
          )}
          {acaoSecundaria && (
            <Link
              href={acaoSecundaria.href}
              className="text-xs text-[var(--muted)] hover:text-[var(--gold)] hover:underline"
            >
              {acaoSecundaria.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Ícones
 * ============================================================ */

function iconProps() {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function IconUsers() {
  return (
    <svg {...iconProps()}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconDocument() {
  return (
    <svg {...iconProps()}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h5a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h5" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg {...iconProps()}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg {...iconProps()}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg {...iconProps()}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg {...iconProps()}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
