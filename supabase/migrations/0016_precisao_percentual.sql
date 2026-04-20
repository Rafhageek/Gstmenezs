-- ============================================================
-- Painel MNZ — Migration 0016
-- ============================================================
-- Motivo: Dr. Jairo cede percentuais muito pequenos do credito
-- principal (ex: 0,016%, 0,010%, 0,028%). O tipo numeric(5,2)
-- arredondava para 2 casas decimais, perdendo precisao.
--
-- Novo tipo: numeric(7,4) — aceita ate 999,9999% (range seguro)
-- com 4 casas decimais.
-- ============================================================

alter table public.cessoes_credito
  alter column percentual_cedido type numeric(7,4);

alter table public.cessionarios
  alter column percentual type numeric(7,4);

comment on column public.cessoes_credito.percentual_cedido is
  'Percentual do credito cedido ao cessionario (0-100, 4 casas decimais). Ex: 0.0160 = 0,016%';

comment on column public.cessionarios.percentual is
  'Percentual cedido (espelho do percentual_cedido das cessoes). Ex: 0.0160 = 0,016%';
