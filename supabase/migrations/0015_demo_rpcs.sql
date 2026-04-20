-- ============================================================
-- Painel MNZ — Migration 0015
-- ============================================================
-- RPCs para o admin popular e limpar dados ficticios (demo).
-- Identificacao: todo registro demo tem observacoes comecando com '[DEMO]'.
--
-- popular_dados_demo():
--   - 6 clientes, 6 cessionarios, 10 cessoes (liquidadas, a receber,
--     inadimplentes, cancelada), 1 portal link
--   - Idempotente (ON CONFLICT)
--
-- limpar_dados_demo():
--   - Apaga tudo com observacoes like '[DEMO]%'
--   - Nao toca em dados reais
-- ============================================================

-- ------------------------------------------------------------
-- POPULAR DADOS DEMO
-- ------------------------------------------------------------

create or replace function public.popular_dados_demo()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_id uuid;
  v_user_role public.user_role;
  v_marcos uuid; v_ana uuid; v_carlos uuid;
  v_alpha uuid; v_beatriz uuid; v_roberto uuid;
  v_ces1 uuid; v_ces2 uuid; v_ces3 uuid;
  v_ces4 uuid; v_ces5 uuid; v_ces6 uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid;
  v_a1 uuid; v_a2 uuid; v_a3 uuid; v_a4 uuid;
  v_i1 uuid; v_i2 uuid;
  v_c1 uuid;
  v_clientes int := 0;
  v_cessionarios int := 0;
  v_cessoes int := 0;
begin
  -- Valida admin
  select role into v_user_role from public.profiles where id = auth.uid();
  if v_user_role is distinct from 'admin' then
    raise exception 'Apenas administradores podem popular dados demo';
  end if;

  v_admin_id := auth.uid();

  -- ========== CLIENTES PRINCIPAIS ==========
  insert into public.clientes_principais (nome, documento, email, telefone, endereco, observacoes, ativo, created_by)
  values
  ('Marcos Andre de Andrade', '11122233344', 'marcos.andrade@exemplo.com', '11987654321',
   jsonb_build_object('logradouro','Rua das Palmeiras','numero','123','bairro','Centro','cidade','Sao Paulo','uf','SP','cep','01000-000'),
   '[DEMO] Cliente ficticio principal — Marcos', true, v_admin_id),
  ('Ana Paula Ribeiro', '22233344455', 'ana.ribeiro@exemplo.com', '11912345678',
   jsonb_build_object('cidade','Rio de Janeiro','uf','RJ'),
   '[DEMO] Cliente PF — Ana Paula', true, v_admin_id),
  ('Carlos Eduardo Santos', '33344455566', 'carlos.santos@exemplo.com', '21998887777',
   jsonb_build_object('cidade','Belo Horizonte','uf','MG'),
   '[DEMO] Cliente PF — Carlos', true, v_admin_id),
  ('Empresa Alpha Ltda', '44455566000177', 'financeiro@alpha.com.br', '1133221100',
   jsonb_build_object('cidade','Sao Paulo','uf','SP'),
   '[DEMO] Cliente PJ — Alpha', true, v_admin_id),
  ('Beatriz Oliveira Gomes', '55566677788', 'beatriz.gomes@exemplo.com', '11911112222',
   jsonb_build_object('cidade','Curitiba','uf','PR'),
   '[DEMO] Cliente PF — Beatriz (inadimplente)', true, v_admin_id),
  ('Roberto Castro Junior', '66677788899', 'roberto.castro@exemplo.com', '1133445566',
   jsonb_build_object('cidade','Porto Alegre','uf','RS'),
   '[DEMO] Cliente PF — Roberto (cancelado)', true, v_admin_id)
  on conflict (documento) do nothing;

  select id into v_marcos from public.clientes_principais where documento = '11122233344';
  select id into v_ana from public.clientes_principais where documento = '22233344455';
  select id into v_carlos from public.clientes_principais where documento = '33344455566';
  select id into v_alpha from public.clientes_principais where documento = '44455566000177';
  select id into v_beatriz from public.clientes_principais where documento = '55566677788';
  select id into v_roberto from public.clientes_principais where documento = '66677788899';

  -- ========== CESSIONARIOS ==========
  insert into public.cessionarios (
    nome, documento, email, telefone, banco, observacoes, ativo, created_by,
    tipo_pessoa, data_contrato, valor_contratado, valor_cessao, percentual
  ) values
  ('Credito Certo Cessoes Ltda', '00000000000191', 'contato@creditocerto.com.br', '1133334444',
   jsonb_build_object('banco','Banco do Brasil','agencia','1234','conta','56789-0','tipo','corrente','pix','contato@creditocerto.com.br'),
   '[DEMO] Cessionario PJ — Credito Certo', true, v_admin_id,
   'PJ', '2026-01-15', 120000.00, 108000.00, 30.00),
  ('Joao da Silva Investidor', '98765432100', 'joao.investidor@exemplo.com', '11999998888',
   jsonb_build_object('banco','Itau','agencia','0001','conta','12345-6','tipo','poupanca','pix','98765432100'),
   '[DEMO] Cessionario PF — Joao Silva', true, v_admin_id,
   'PF', '2026-03-01', 80000.00, 68000.00, 25.00),
  ('Invest Milhao S/A', '12345678000195', 'ri@investmilhao.com.br', '1144445555',
   jsonb_build_object('banco','Bradesco','agencia','5678','conta','98765-4','tipo','corrente','pix','12345678000195'),
   '[DEMO] Cessionario PJ — Invest Milhao', true, v_admin_id,
   'PJ', '2026-06-10', 50000.00, 40000.00, 20.00),
  ('Fundo Recebe+ FIDC', '77788899000122', 'gestao@recebemais.com.br', '1122223333',
   jsonb_build_object('banco','Santander','agencia','2020','conta','11122-3','tipo','corrente','pix','77788899000122'),
   '[DEMO] Cessionario PJ — Fundo FIDC', true, v_admin_id,
   'PJ', '2026-05-20', 200000.00, 170000.00, 35.00),
  ('Maria Aparecida Ferreira', '77766655544', 'maria.ferreira@exemplo.com', '11988776655',
   jsonb_build_object('banco','Caixa Economica','agencia','3030','conta','44455-6','tipo','poupanca','pix','maria.ferreira@exemplo.com'),
   '[DEMO] Cessionario PF — Maria', true, v_admin_id,
   'PF', '2025-06-15', 40000.00, 32000.00, 22.00),
  ('Grupo Investe Sul Ltda', '88899900000144', 'contato@investesul.com.br', '5133445566',
   jsonb_build_object('banco','Sicredi','agencia','4040','conta','77788-9','tipo','corrente','pix','88899900000144'),
   '[DEMO] Cessionario PJ — Investe Sul', true, v_admin_id,
   'PJ', '2025-09-01', 90000.00, 72000.00, 28.00)
  on conflict (documento) do nothing;

  select id into v_ces1 from public.cessionarios where documento = '00000000000191';
  select id into v_ces2 from public.cessionarios where documento = '98765432100';
  select id into v_ces3 from public.cessionarios where documento = '12345678000195';
  select id into v_ces4 from public.cessionarios where documento = '77788899000122';
  select id into v_ces5 from public.cessionarios where documento = '77766655544';
  select id into v_ces6 from public.cessionarios where documento = '88899900000144';

  -- ========== CESSOES LIQUIDADAS (3) ==========
  insert into public.cessoes_credito (
    numero_contrato, cliente_principal_id, cessionario_id,
    valor_total, parcelas_total, data_cessao, data_vencimento_inicial,
    taxa_juros, percentual_cedido, observacoes, created_by
  ) values
  ('DEMO-L001/2024', v_marcos, v_ces1, 50000.00, 4, '2024-03-10', '2024-04-10', 1.20, 30.00,
   '[DEMO] Cessao liquidada — Marcos/Credito Certo', v_admin_id),
  ('DEMO-L002/2024', v_ana, v_ces2, 30000.00, 6, '2024-06-01', '2024-07-01', 1.00, 25.00,
   '[DEMO] Cessao liquidada — Ana/Joao Silva', v_admin_id),
  ('DEMO-L003/2025', v_alpha, v_ces3, 100000.00, 8, '2025-01-15', '2025-02-15', 0.80, 20.00,
   '[DEMO] Cessao liquidada — Alpha/Invest Milhao', v_admin_id)
  on conflict (numero_contrato) do nothing;

  -- ========== CESSOES A RECEBER (4) ==========
  insert into public.cessoes_credito (
    numero_contrato, cliente_principal_id, cessionario_id,
    valor_total, parcelas_total, data_cessao, data_vencimento_inicial,
    taxa_juros, percentual_cedido, observacoes, created_by
  ) values
  ('MARCOS-001/2026', v_marcos, v_ces1, 120000.00, 12, '2026-01-15', '2026-02-15', 1.50, 30.00,
   '[DEMO] Cessao a receber — Marcos/Credito Certo (principal 2026)', v_admin_id),
  ('MARCOS-002/2026', v_marcos, v_ces2, 80000.00, 24, '2026-03-01', '2026-04-01', 1.00, 25.00,
   '[DEMO] Cessao a receber — Marcos/Joao Silva', v_admin_id),
  ('MARCOS-003/2026', v_marcos, v_ces3, 50000.00, 6, '2026-06-10', '2026-07-10', 0.80, 20.00,
   '[DEMO] Cessao a receber — Marcos/Invest Milhao', v_admin_id),
  ('DEMO-A001/2026', v_carlos, v_ces4, 200000.00, 20, '2026-05-20', '2026-06-20', 1.20, 35.00,
   '[DEMO] Cessao a receber — Carlos/Fundo FIDC', v_admin_id)
  on conflict (numero_contrato) do nothing;

  -- ========== CESSOES INADIMPLENTES (2) ==========
  insert into public.cessoes_credito (
    numero_contrato, cliente_principal_id, cessionario_id,
    valor_total, parcelas_total, data_cessao, data_vencimento_inicial,
    taxa_juros, percentual_cedido, observacoes, created_by
  ) values
  ('DEMO-I001/2025', v_beatriz, v_ces5, 40000.00, 8, '2025-06-15', '2025-07-15', 1.80, 22.00,
   '[DEMO] Cessao inadimplente — Beatriz/Maria', v_admin_id),
  ('DEMO-I002/2025', v_carlos, v_ces6, 90000.00, 12, '2025-09-01', '2025-10-01', 1.50, 28.00,
   '[DEMO] Cessao inadimplente — Carlos/Investe Sul', v_admin_id)
  on conflict (numero_contrato) do nothing;

  -- ========== CESSAO CANCELADA (1) ==========
  insert into public.cessoes_credito (
    numero_contrato, cliente_principal_id, cessionario_id,
    valor_total, parcelas_total, data_cessao, data_vencimento_inicial,
    taxa_juros, percentual_cedido, observacoes, status, created_by
  ) values
  ('DEMO-C001/2026', v_roberto, v_ces4, 25000.00, 5, '2026-02-10', '2026-03-10', 1.00, 15.00,
   '[DEMO] Cessao cancelada — Roberto/Fundo FIDC', 'cancelada', v_admin_id)
  on conflict (numero_contrato) do nothing;

  -- ========== MARCAR PARCELAS COMO PAGAS ==========

  -- Liquidadas: TODAS as parcelas pagas
  update public.pagamentos p
     set data_pagamento = p.data_vencimento
    from public.cessoes_credito c
   where p.cessao_id = c.id
     and c.numero_contrato like 'DEMO-L%'
     and p.data_pagamento is null;

  -- MARCOS-001/2026: 2 primeiras parcelas pagas
  update public.pagamentos p
     set data_pagamento = p.data_vencimento
    from public.cessoes_credito c
   where p.cessao_id = c.id
     and c.numero_contrato = 'MARCOS-001/2026'
     and p.numero_parcela in (1, 2)
     and p.data_pagamento is null;

  -- DEMO-A001/2026: 1 parcela paga
  update public.pagamentos p
     set data_pagamento = p.data_vencimento
    from public.cessoes_credito c
   where p.cessao_id = c.id
     and c.numero_contrato = 'DEMO-A001/2026'
     and p.numero_parcela = 1
     and p.data_pagamento is null;

  -- DEMO-I001/2025: primeira paga, resto vencendo
  update public.pagamentos p
     set data_pagamento = p.data_vencimento
    from public.cessoes_credito c
   where p.cessao_id = c.id
     and c.numero_contrato = 'DEMO-I001/2025'
     and p.numero_parcela = 1
     and p.data_pagamento is null;

  -- DEMO-I002/2025: primeiras 3 pagas, resto atrasado
  update public.pagamentos p
     set data_pagamento = p.data_vencimento
    from public.cessoes_credito c
   where p.cessao_id = c.id
     and c.numero_contrato = 'DEMO-I002/2025'
     and p.numero_parcela in (1, 2, 3)
     and p.data_pagamento is null;

  -- ========== CONTAGENS ==========
  select count(*) into v_clientes
    from public.clientes_principais where observacoes like '[DEMO]%';
  select count(*) into v_cessionarios
    from public.cessionarios where observacoes like '[DEMO]%';
  select count(*) into v_cessoes
    from public.cessoes_credito where observacoes like '[DEMO]%';

  return jsonb_build_object(
    'ok', true,
    'clientes', v_clientes,
    'cessionarios', v_cessionarios,
    'cessoes', v_cessoes
  );
end;
$$;

comment on function public.popular_dados_demo() is
  'Popula 6 clientes, 6 cessionarios e 10 cessoes ficticias (marcador [DEMO]). Requer role admin.';

-- ------------------------------------------------------------
-- LIMPAR DADOS DEMO
-- ------------------------------------------------------------

create or replace function public.limpar_dados_demo()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_role public.user_role;
  v_pagamentos int;
  v_cessoes int;
  v_cessionarios int;
  v_clientes int;
begin
  select role into v_user_role from public.profiles where id = auth.uid();
  if v_user_role is distinct from 'admin' then
    raise exception 'Apenas administradores podem limpar dados demo';
  end if;

  -- Apaga pagamentos das cessoes demo (cascata manual)
  with alvos as (
    select id from public.cessoes_credito where observacoes like '[DEMO]%'
  )
  delete from public.pagamentos where cessao_id in (select id from alvos);
  get diagnostics v_pagamentos = row_count;

  -- Apaga cessoes demo
  delete from public.cessoes_credito where observacoes like '[DEMO]%';
  get diagnostics v_cessoes = row_count;

  -- Apaga cessionarios demo
  delete from public.cessionarios where observacoes like '[DEMO]%';
  get diagnostics v_cessionarios = row_count;

  -- Apaga clientes demo
  delete from public.clientes_principais where observacoes like '[DEMO]%';
  get diagnostics v_clientes = row_count;

  return jsonb_build_object(
    'ok', true,
    'pagamentos_apagados', v_pagamentos,
    'cessoes_apagadas', v_cessoes,
    'cessionarios_apagados', v_cessionarios,
    'clientes_apagados', v_clientes
  );
end;
$$;

comment on function public.limpar_dados_demo() is
  'Apaga todos os dados com observacoes like [DEMO]. Nao toca em dados reais. Requer role admin.';

-- ------------------------------------------------------------
-- VIEW — contagem demo (para o admin ver o que esta populado)
-- ------------------------------------------------------------

create or replace view public.v_demo_counts as
select
  (select count(*) from public.clientes_principais where observacoes like '[DEMO]%') as clientes,
  (select count(*) from public.cessionarios where observacoes like '[DEMO]%') as cessionarios,
  (select count(*) from public.cessoes_credito where observacoes like '[DEMO]%') as cessoes,
  (select count(*) from public.pagamentos p
     join public.cessoes_credito c on c.id = p.cessao_id
    where c.observacoes like '[DEMO]%') as pagamentos;

comment on view public.v_demo_counts is 'Contadores de registros demo (ficticios) no sistema';

-- ------------------------------------------------------------
-- GRANTS
-- ------------------------------------------------------------

grant execute on function public.popular_dados_demo() to authenticated;
grant execute on function public.limpar_dados_demo() to authenticated;
grant select on public.v_demo_counts to authenticated;
