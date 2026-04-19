-- ============================================================
-- Painel MNZ — Migration 0006
-- ============================================================
-- Fecha os 2 gaps dos requisitos do cliente:
-- 1. percentual_cedido: % do crédito que foi cedido ao cessionário
-- 2. RPC para editar valor/vencimento de parcelas individuais
--    (habilita parcelas variáveis — requisito do cliente)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Percentual cedido
-- ------------------------------------------------------------

alter table public.cessoes_credito
  add column if not exists percentual_cedido numeric(5,2)
  check (percentual_cedido is null or (percentual_cedido >= 0 and percentual_cedido <= 100));

comment on column public.cessoes_credito.percentual_cedido is
  'Percentual do crédito que foi cedido ao cessionário (0-100)';

-- ------------------------------------------------------------
-- 2. Editar parcela individual (apenas não pagas)
-- ------------------------------------------------------------

create or replace function public.atualizar_parcela(
  p_pagamento_id uuid,
  p_valor numeric,
  p_data_vencimento date,
  p_observacoes text default null
)
returns public.pagamentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original public.pagamentos;
  v_atualizado public.pagamentos;
begin
  select * into v_original from public.pagamentos where id = p_pagamento_id;
  if not found then
    raise exception 'Parcela % não encontrada', p_pagamento_id;
  end if;
  if v_original.data_pagamento is not null then
    raise exception 'Não é possível editar parcela já paga';
  end if;
  if v_original.is_reversal then
    raise exception 'Não é possível editar um estorno';
  end if;
  if p_valor <= 0 then
    raise exception 'Valor deve ser positivo';
  end if;

  update public.pagamentos
     set valor = p_valor,
         valor_original = p_valor,
         data_vencimento = p_data_vencimento,
         observacoes = coalesce(p_observacoes, observacoes)
   where id = p_pagamento_id
  returning * into v_atualizado;

  insert into public.logs_auditoria (
    user_id, acao, entidade, entidade_id, dados_anteriores, dados_novos
  ) values (
    auth.uid(),
    'editar_parcela',
    'pagamento',
    p_pagamento_id,
    to_jsonb(v_original),
    to_jsonb(v_atualizado)
  );

  return v_atualizado;
end;
$$;

comment on function public.atualizar_parcela(uuid, numeric, date, text) is
  'Edita valor/vencimento de parcela não paga (habilita parcelas variáveis)';
