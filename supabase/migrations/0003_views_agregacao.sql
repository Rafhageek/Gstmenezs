-- ============================================================
-- Painel MNZ — Migration 0003
-- ============================================================
-- Views de agregação para o dashboard e relatórios:
--   - v_fluxo_mensal: previsto vs realizado por mês
--   - v_inadimplencia: parcelas atrasadas com info da cessão
--   - v_extrato_cliente: resumo por cliente principal
-- ============================================================

-- ------------------------------------------------------------
-- Fluxo mensal: 12 meses (6 anteriores + atual + 5 futuros)
-- ------------------------------------------------------------

create or replace view public.v_fluxo_mensal as
with meses as (
  select
    date_trunc('month', current_date - (i || ' months')::interval)::date as mes
  from generate_series(-5, 6) as i
),
previsto as (
  select
    date_trunc('month', data_vencimento)::date as mes,
    sum(case when is_reversal then -valor else valor end) as valor
  from public.pagamentos
  group by 1
),
realizado as (
  select
    date_trunc('month', data_pagamento)::date as mes,
    sum(case when is_reversal then -valor else valor end) as valor
  from public.pagamentos
  where data_pagamento is not null
  group by 1
)
select
  m.mes,
  to_char(m.mes, 'TMMon/YY') as mes_label,
  coalesce(p.valor, 0) as previsto,
  coalesce(r.valor, 0) as realizado
from meses m
left join previsto p on p.mes = m.mes
left join realizado r on r.mes = m.mes
order by m.mes;

comment on view public.v_fluxo_mensal is 'Previsto vs realizado mensal — janela de 12 meses';

-- ------------------------------------------------------------
-- Inadimplência: parcelas vencidas e não pagas
-- ------------------------------------------------------------

create or replace view public.v_inadimplencia as
select
  p.id as pagamento_id,
  p.cessao_id,
  p.numero_parcela,
  p.valor,
  p.data_vencimento,
  current_date - p.data_vencimento as dias_atraso,
  c.numero_contrato,
  cp.id as cliente_id,
  cp.nome as cliente_nome,
  cp.documento as cliente_documento,
  ce.nome as cessionario_nome
from public.pagamentos p
join public.cessoes_credito c on c.id = p.cessao_id
join public.clientes_principais cp on cp.id = c.cliente_principal_id
join public.cessionarios ce on ce.id = c.cessionario_id
where p.data_pagamento is null
  and p.is_reversal = false
  and p.data_vencimento < current_date
  and c.status not in ('cancelada', 'quitada')
order by p.data_vencimento asc;

comment on view public.v_inadimplencia is 'Parcelas vencidas e não pagas (excluindo cessões canceladas/quitadas)';

-- ------------------------------------------------------------
-- Extrato consolidado por cliente principal
-- ------------------------------------------------------------

create or replace view public.v_extrato_cliente as
select
  cp.id as cliente_id,
  cp.nome as cliente_nome,
  cp.documento as cliente_documento,
  count(distinct c.id) as total_cessoes,
  count(distinct c.id) filter (where c.status = 'ativa') as cessoes_ativas,
  count(distinct c.id) filter (where c.status = 'quitada') as cessoes_quitadas,
  coalesce(sum(c.valor_total), 0) as volume_total,
  coalesce(sum(c.valor_pago), 0) as total_recebido,
  coalesce(sum(c.valor_total - c.valor_pago), 0) as saldo_devedor
from public.clientes_principais cp
left join public.cessoes_credito c on c.cliente_principal_id = cp.id
group by cp.id, cp.nome, cp.documento;

comment on view public.v_extrato_cliente is 'Resumo financeiro consolidado por cliente principal';
