-- ============================================================
-- Painel MNZ — Migration 0013
-- ============================================================
-- Solicitacao Dr. Jairo (audio):
-- 1. Adicionar campos em cessionarios:
--    - tipo_pessoa (PF/PJ)
--    - data_contrato, valor_contratado, valor_cessao, percentual
-- 2. Trocar nomenclatura "ativa" por "a_receber" (opcional, mantendo compat)
-- 3. View de cessoes liquidadas + totais para dashboard
-- ============================================================

-- ------------------------------------------------------------
-- CESSIONARIOS — campos extras
-- ------------------------------------------------------------

alter table public.cessionarios
  add column if not exists tipo_pessoa text
    check (tipo_pessoa in ('PF', 'PJ')) default 'PJ';

alter table public.cessionarios
  add column if not exists data_contrato date;

alter table public.cessionarios
  add column if not exists valor_contratado numeric(15,2)
    check (valor_contratado is null or valor_contratado >= 0);

alter table public.cessionarios
  add column if not exists valor_cessao numeric(15,2)
    check (valor_cessao is null or valor_cessao >= 0);

alter table public.cessionarios
  add column if not exists percentual numeric(5,2)
    check (percentual is null or (percentual >= 0 and percentual <= 100));

comment on column public.cessionarios.tipo_pessoa is 'PF (pessoa fisica) ou PJ (pessoa juridica)';
comment on column public.cessionarios.data_contrato is 'Data do contrato de cessao com o cedente';
comment on column public.cessionarios.valor_contratado is 'Valor original contratado';
comment on column public.cessionarios.valor_cessao is 'Valor efetivo da cessao (pode diferir do contratado)';
comment on column public.cessionarios.percentual is 'Percentual do credito cedido (0-100)';

-- ------------------------------------------------------------
-- VIEW — cessoes liquidadas (quitadas)
-- ------------------------------------------------------------

create or replace view public.v_cessoes_liquidadas as
select
  c.id,
  c.numero_contrato,
  c.valor_total,
  c.valor_pago,
  c.data_cessao,
  c.data_vencimento_inicial,
  (
    select max(p.data_pagamento)
    from public.pagamentos p
    where p.cessao_id = c.id
      and p.data_pagamento is not null
  ) as data_liquidacao,
  cp.nome as cliente_nome,
  cp.documento as cliente_documento,
  ce.nome as cessionario_nome
from public.cessoes_credito c
join public.clientes_principais cp on cp.id = c.cliente_principal_id
join public.cessionarios ce on ce.id = c.cessionario_id
where c.status = 'quitada'
order by (
  select max(p.data_pagamento)
  from public.pagamentos p
  where p.cessao_id = c.id
    and p.data_pagamento is not null
) desc nulls last;

comment on view public.v_cessoes_liquidadas is 'Cessoes ja quitadas/liquidadas — para card no topo do dashboard';

-- ------------------------------------------------------------
-- VIEW — resumo geral (para pizza liquidadas vs a receber)
-- ------------------------------------------------------------

create or replace view public.v_resumo_geral as
select
  count(*) filter (where status = 'quitada') as qtd_liquidadas,
  count(*) filter (where status in ('ativa', 'inadimplente')) as qtd_a_receber,
  count(*) filter (where status = 'cancelada') as qtd_canceladas,
  coalesce(sum(valor_total) filter (where status = 'quitada'), 0) as valor_liquidado,
  coalesce(sum(valor_total - valor_pago) filter (where status in ('ativa', 'inadimplente')), 0) as valor_a_receber,
  coalesce(sum(valor_pago), 0) as valor_recebido_total,
  coalesce(sum(valor_total), 0) as volume_total
from public.cessoes_credito;

comment on view public.v_resumo_geral is 'Resumo geral — liquidadas vs a receber para grafico pizza';

-- Grants (views herdam policies das tabelas subjacentes via RLS)
grant select on public.v_cessoes_liquidadas to authenticated;
grant select on public.v_resumo_geral to authenticated;
