-- ============================================================
-- Painel MNZ — Seed (dados ficticios p/ teste Dr. Jairo)
-- ============================================================
-- Cliente fake: Marcos Andre de Andrade + 3 cessionarios + 3 cessoes 2026.
-- Usado para validar os novos campos (tipo_pessoa, data_contrato, etc)
-- e as funcoes (Sessoes Liquidadas, Valor a receber, etc).
--
-- IDEMPOTENTE: pode ser re-executado. Usa ON CONFLICT DO NOTHING.
--
-- ROLLBACK (quando quiser apagar os dados fake):
--   delete from public.pagamentos where cessao_id in (
--     select id from public.cessoes_credito
--     where numero_contrato like 'MARCOS-%/2026'
--   );
--   delete from public.cessoes_credito where numero_contrato like 'MARCOS-%/2026';
--   delete from public.cessionarios where documento in
--     ('00000000000191', '98765432100', '12345678000195');
--   delete from public.clientes_principais where documento = '11122233344';
-- ============================================================

do $$
declare
  v_admin_id uuid;
  v_marcos_id uuid;
  v_ces1_id uuid;
  v_ces2_id uuid;
  v_ces3_id uuid;
begin
  -- Pega o perfil admin (created_by)
  select id into v_admin_id
    from public.profiles
   where email = 'contato@menezesadvocacia.com'
   limit 1;

  if v_admin_id is null then
    raise exception 'Perfil admin nao encontrado. Faca login primeiro com contato@menezesadvocacia.com';
  end if;

  -- ----------------------------------------------------------
  -- CLIENTE PRINCIPAL — Marcos Andre de Andrade
  -- ----------------------------------------------------------
  insert into public.clientes_principais (
    nome, documento, email, telefone, endereco, observacoes, ativo, created_by
  ) values (
    'Marcos Andre de Andrade',
    '11122233344',
    'marcos.andrade@exemplo.com',
    '11987654321',
    jsonb_build_object(
      'logradouro', 'Rua das Palmeiras',
      'numero', '123',
      'bairro', 'Centro',
      'cidade', 'Sao Paulo',
      'uf', 'SP',
      'cep', '01000-000'
    ),
    'Cliente fake para testes — dados NAO REAIS.',
    true,
    v_admin_id
  )
  on conflict (documento) do nothing;

  select id into v_marcos_id
    from public.clientes_principais
   where documento = '11122233344';

  -- ----------------------------------------------------------
  -- CESSIONARIO 1 — PJ "Credito Certo Cessoes Ltda"
  -- ----------------------------------------------------------
  insert into public.cessionarios (
    nome, documento, email, telefone, banco, observacoes, ativo, created_by,
    tipo_pessoa, data_contrato, valor_contratado, valor_cessao, percentual
  ) values (
    'Credito Certo Cessoes Ltda',
    '00000000000191',
    'contato@creditocerto.com.br',
    '1133334444',
    jsonb_build_object(
      'banco', 'Banco do Brasil',
      'agencia', '1234',
      'conta', '56789-0',
      'tipo', 'corrente',
      'pix', 'contato@creditocerto.com.br'
    ),
    'Cessionario fake PJ — teste.',
    true,
    v_admin_id,
    'PJ',
    '2026-01-15',
    120000.00,
    108000.00,
    30.00
  )
  on conflict (documento) do nothing;

  select id into v_ces1_id
    from public.cessionarios where documento = '00000000000191';

  -- ----------------------------------------------------------
  -- CESSIONARIO 2 — PF Joao da Silva Investidor
  -- ----------------------------------------------------------
  insert into public.cessionarios (
    nome, documento, email, telefone, banco, observacoes, ativo, created_by,
    tipo_pessoa, data_contrato, valor_contratado, valor_cessao, percentual
  ) values (
    'Joao da Silva Investidor',
    '98765432100',
    'joao.investidor@exemplo.com',
    '11999998888',
    jsonb_build_object(
      'banco', 'Itau',
      'agencia', '0001',
      'conta', '12345-6',
      'tipo', 'poupanca',
      'pix', '98765432100'
    ),
    'Cessionario fake PF — teste.',
    true,
    v_admin_id,
    'PF',
    '2026-03-01',
    80000.00,
    68000.00,
    25.00
  )
  on conflict (documento) do nothing;

  select id into v_ces2_id
    from public.cessionarios where documento = '98765432100';

  -- ----------------------------------------------------------
  -- CESSIONARIO 3 — PJ Invest Milhao S/A
  -- ----------------------------------------------------------
  insert into public.cessionarios (
    nome, documento, email, telefone, banco, observacoes, ativo, created_by,
    tipo_pessoa, data_contrato, valor_contratado, valor_cessao, percentual
  ) values (
    'Invest Milhao S/A',
    '12345678000195',
    'ri@investmilhao.com.br',
    '1144445555',
    jsonb_build_object(
      'banco', 'Bradesco',
      'agencia', '5678',
      'conta', '98765-4',
      'tipo', 'corrente',
      'pix', '12345678000195'
    ),
    'Cessionario fake PJ — teste.',
    true,
    v_admin_id,
    'PJ',
    '2026-06-10',
    50000.00,
    40000.00,
    20.00
  )
  on conflict (documento) do nothing;

  select id into v_ces3_id
    from public.cessionarios where documento = '12345678000195';

  -- ----------------------------------------------------------
  -- CESSAO 1 — MARCOS-001/2026 (12 parcelas, R$ 120.000)
  -- ----------------------------------------------------------
  insert into public.cessoes_credito (
    numero_contrato, cliente_principal_id, cessionario_id,
    valor_total, parcelas_total, data_cessao, data_vencimento_inicial,
    taxa_juros, percentual_cedido, observacoes, created_by
  ) values (
    'MARCOS-001/2026',
    v_marcos_id, v_ces1_id,
    120000.00, 12,
    '2026-01-15', '2026-02-15',
    1.50, 30.00,
    'Cessao fake — contrato principal 2026.',
    v_admin_id
  )
  on conflict (numero_contrato) do nothing;

  -- ----------------------------------------------------------
  -- CESSAO 2 — MARCOS-002/2026 (24 parcelas, R$ 80.000)
  -- ----------------------------------------------------------
  insert into public.cessoes_credito (
    numero_contrato, cliente_principal_id, cessionario_id,
    valor_total, parcelas_total, data_cessao, data_vencimento_inicial,
    taxa_juros, percentual_cedido, observacoes, created_by
  ) values (
    'MARCOS-002/2026',
    v_marcos_id, v_ces2_id,
    80000.00, 24,
    '2026-03-01', '2026-04-01',
    1.00, 25.00,
    'Cessao fake — longa duracao.',
    v_admin_id
  )
  on conflict (numero_contrato) do nothing;

  -- ----------------------------------------------------------
  -- CESSAO 3 — MARCOS-003/2026 (6 parcelas, R$ 50.000)
  -- ----------------------------------------------------------
  insert into public.cessoes_credito (
    numero_contrato, cliente_principal_id, cessionario_id,
    valor_total, parcelas_total, data_cessao, data_vencimento_inicial,
    taxa_juros, percentual_cedido, observacoes, created_by
  ) values (
    'MARCOS-003/2026',
    v_marcos_id, v_ces3_id,
    50000.00, 6,
    '2026-06-10', '2026-07-10',
    0.80, 20.00,
    'Cessao fake — curta duracao.',
    v_admin_id
  )
  on conflict (numero_contrato) do nothing;

  raise notice 'Seed Marcos Andre aplicado com sucesso.';
end $$;

-- ============================================================
-- BONUS: simula 2 parcelas ja pagas na cessao MARCOS-001/2026
-- (para o card "Sessoes Liquidadas" ter algo visual mesmo
--  antes de todas as parcelas vencerem)
-- ============================================================

update public.pagamentos
   set data_pagamento = data_vencimento
 where cessao_id = (
   select id from public.cessoes_credito
    where numero_contrato = 'MARCOS-001/2026'
 )
   and numero_parcela in (1, 2)
   and data_pagamento is null;
