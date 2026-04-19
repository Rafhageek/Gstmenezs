-- ============================================================
-- Painel MNZ — Migration 0008
-- ============================================================
-- Views adicionais para dashboard avancado:
--   - v_aging_buckets: classifica atrasos (0-30, 31-60, 61-90, 90+)
--   - v_parcelas_proximas: parcelas vencendo nos proximos 7 dias
--   - v_dso: Days Sales Outstanding (dias medios p/ receber)
-- ============================================================

-- ------------------------------------------------------------
-- Aging buckets (padrao AR: classificacao de atrasos)
-- ------------------------------------------------------------

drop view if exists public.v_aging_buckets;

create view public.v_aging_buckets as
with atrasos as (
  select
    p.valor,
    (current_date - p.data_vencimento) as dias_atraso
  from public.pagamentos p
  join public.cessoes_credito c on c.id = p.cessao_id
  where p.data_pagamento is null
    and p.is_reversal = false
    and p.data_vencimento < current_date
    and c.status not in ('cancelada', 'quitada')
),
buckets as (
  select
    case
      when dias_atraso <= 30 then 'ate_30'
      when dias_atraso <= 60 then 'de_31_60'
      when dias_atraso <= 90 then 'de_61_90'
      else 'acima_90'
    end as bucket,
    valor
  from atrasos
)
select
  'ate_30' as bucket,
  coalesce(sum(valor) filter (where bucket = 'ate_30'), 0) as valor,
  count(*) filter (where bucket = 'ate_30') as qtd
from buckets
union all
select
  'de_31_60' as bucket,
  coalesce(sum(valor) filter (where bucket = 'de_31_60'), 0),
  count(*) filter (where bucket = 'de_31_60')
from buckets
union all
select
  'de_61_90' as bucket,
  coalesce(sum(valor) filter (where bucket = 'de_61_90'), 0),
  count(*) filter (where bucket = 'de_61_90')
from buckets
union all
select
  'acima_90' as bucket,
  coalesce(sum(valor) filter (where bucket = 'acima_90'), 0),
  count(*) filter (where bucket = 'acima_90')
from buckets;

comment on view public.v_aging_buckets is
  'Aging (envelhecimento) de parcelas vencidas — padrao de Accounts Receivable';

-- ------------------------------------------------------------
-- Parcelas vencendo nos proximos 7 dias (notificacoes)
-- ------------------------------------------------------------

drop view if exists public.v_parcelas_proximas;

create view public.v_parcelas_proximas as
select
  p.id as pagamento_id,
  p.cessao_id,
  p.numero_parcela,
  p.valor,
  p.data_vencimento,
  (p.data_vencimento - current_date) as dias_ate_vencer,
  c.numero_contrato,
  cp.id as cliente_id,
  cp.nome as cliente_nome,
  ce.nome as cessionario_nome
from public.pagamentos p
join public.cessoes_credito c on c.id = p.cessao_id
join public.clientes_principais cp on cp.id = c.cliente_principal_id
join public.cessionarios ce on ce.id = c.cessionario_id
where p.data_pagamento is null
  and p.is_reversal = false
  and c.status not in ('cancelada', 'quitada')
  and p.data_vencimento >= current_date
  and p.data_vencimento <= current_date + interval '7 days'
order by p.data_vencimento;

comment on view public.v_parcelas_proximas is
  'Parcelas vencendo nos proximos 7 dias (para sino de notificacoes)';

-- ------------------------------------------------------------
-- DSO: Days Sales Outstanding
-- Media de dias entre vencimento e pagamento efetivo.
-- Menor = melhor (dinheiro entra mais rapido).
-- ------------------------------------------------------------

drop view if exists public.v_dso;

create view public.v_dso as
select
  coalesce(
    round(avg(p.data_pagamento - p.data_vencimento))::integer,
    0
  ) as dso_dias,
  count(*) as parcelas_consideradas
from public.pagamentos p
where p.data_pagamento is not null
  and p.is_reversal = false
  and p.data_pagamento >= current_date - interval '180 days';

comment on view public.v_dso is
  'DSO: Days Sales Outstanding — media de dias entre vencimento e pagamento (ultimos 180 dias)';

-- ------------------------------------------------------------
-- Comparativo mes a mes (recebido neste mes vs anterior)
-- ------------------------------------------------------------

drop view if exists public.v_comparativo_mes;

create view public.v_comparativo_mes as
with base as (
  select
    date_trunc('month', p.data_pagamento)::date as mes,
    case when p.is_reversal then -p.valor else p.valor end as valor
  from public.pagamentos p
  where p.data_pagamento is not null
    and p.data_pagamento >= date_trunc('month', current_date) - interval '1 month'
)
select
  coalesce(sum(base.valor) filter (
    where base.mes = date_trunc('month', current_date)::date
  ), 0) as mes_atual,
  coalesce(sum(base.valor) filter (
    where base.mes = date_trunc('month', current_date - interval '1 month')::date
  ), 0) as mes_anterior
from base;

comment on view public.v_comparativo_mes is
  'Recebido no mes atual vs mes anterior';

-- ------------------------------------------------------------
-- Indices para paginacao/ordenacao mais eficiente
-- ------------------------------------------------------------

create index if not exists idx_cessoes_credito_numero_contrato
  on public.cessoes_credito(numero_contrato);

create index if not exists idx_clientes_principais_nome
  on public.clientes_principais(nome);

create index if not exists idx_cessionarios_nome
  on public.cessionarios(nome);
