-- ============================================================
-- Painel MNZ — Migration 0018
-- ============================================================
-- Adiciona coluna `percentual_cedido` na view v_cessoes_resumo.
-- Necessario pra tabela "Cessoes deste cliente" exibir % cedida
-- por cessao (a pedido do Dr. Jairo).
-- ============================================================

drop view if exists public.v_cessoes_resumo cascade;

create view public.v_cessoes_resumo as
select
  c.id,
  c.numero_contrato,
  c.valor_total,
  c.valor_pago,
  (c.valor_total - c.valor_pago) as saldo_devedor,
  case
    when c.valor_total = 0 then 0
    else round((c.valor_pago / c.valor_total) * 100, 2)
  end as percentual_pago,
  c.status,
  c.data_cessao,
  c.data_vencimento_inicial,
  c.cliente_principal_id as cliente_id,
  cp.nome as cliente_nome,
  c.cessionario_id,
  ce.nome as cessionario_nome,
  c.percentual_cedido,
  (
    select min(p.data_vencimento)
    from public.pagamentos p
    where p.cessao_id = c.id
      and p.data_pagamento is null
      and p.data_vencimento < current_date
      and p.is_reversal = false
  ) as primeira_parcela_atrasada
from public.cessoes_credito c
join public.clientes_principais cp on cp.id = c.cliente_principal_id
join public.cessionarios ce on ce.id = c.cessionario_id;

comment on view public.v_cessoes_resumo is
  'Resumo financeiro por cessao para o dashboard. Inclui percentual_cedido (2026-04-22).';
