-- ============================================================
-- Painel MNZ — Migration 0002
-- ============================================================
-- 1. Trigger que gera parcelas automaticamente ao criar cessão
-- 2. Função para registrar/estornar pagamentos
-- 3. Bucket de Storage para comprovantes
-- ============================================================

-- ------------------------------------------------------------
-- 1. Geração automática de parcelas ao criar cessão
-- ------------------------------------------------------------

create or replace function public.gerar_parcelas_cessao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor_parcela numeric(15,2);
  v_resto numeric(15,2);
  v_data date;
  i integer;
begin
  -- Valor por parcela com arredondamento, último ajusta o resto.
  v_valor_parcela := round(new.valor_total / new.parcelas_total, 2);
  v_resto := new.valor_total - (v_valor_parcela * new.parcelas_total);

  for i in 1..new.parcelas_total loop
    v_data := (new.data_vencimento_inicial::date + ((i - 1) || ' months')::interval)::date;

    insert into public.pagamentos (
      cessao_id,
      numero_parcela,
      valor,
      data_vencimento,
      tipo,
      created_by
    ) values (
      new.id,
      i,
      case when i = new.parcelas_total then v_valor_parcela + v_resto else v_valor_parcela end,
      v_data,
      'parcela',
      new.created_by
    );
  end loop;

  return new;
end;
$$;

create trigger trg_cessao_gera_parcelas
  after insert on public.cessoes_credito
  for each row execute function public.gerar_parcelas_cessao();

-- ------------------------------------------------------------
-- 2. Função para registrar pagamento (com auditoria embutida)
-- ------------------------------------------------------------

create or replace function public.registrar_pagamento(
  p_pagamento_id uuid,
  p_data_pagamento date,
  p_valor numeric default null,
  p_observacoes text default null
)
returns public.pagamentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pagamento public.pagamentos;
  v_dados_anteriores jsonb;
begin
  select * into v_pagamento from public.pagamentos where id = p_pagamento_id;
  if not found then
    raise exception 'Pagamento % não encontrado', p_pagamento_id;
  end if;
  if v_pagamento.data_pagamento is not null then
    raise exception 'Pagamento já foi registrado anteriormente';
  end if;

  v_dados_anteriores := to_jsonb(v_pagamento);

  update public.pagamentos
  set data_pagamento = p_data_pagamento,
      valor = coalesce(p_valor, valor),
      observacoes = coalesce(p_observacoes, observacoes)
  where id = p_pagamento_id
  returning * into v_pagamento;

  insert into public.logs_auditoria (user_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
  values (auth.uid(), 'registrar_pagamento', 'pagamento', p_pagamento_id, v_dados_anteriores, to_jsonb(v_pagamento));

  return v_pagamento;
end;
$$;

-- ------------------------------------------------------------
-- 3. Função para estornar pagamento (cria contra-lançamento)
-- ------------------------------------------------------------

create or replace function public.estornar_pagamento(
  p_pagamento_id uuid,
  p_motivo text
)
returns public.pagamentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_origem public.pagamentos;
  v_estorno public.pagamentos;
begin
  select * into v_origem from public.pagamentos where id = p_pagamento_id;
  if not found then
    raise exception 'Pagamento % não encontrado', p_pagamento_id;
  end if;
  if v_origem.is_reversal then
    raise exception 'Não é possível estornar um estorno';
  end if;
  if v_origem.data_pagamento is null then
    raise exception 'Não é possível estornar pagamento ainda não efetivado';
  end if;

  insert into public.pagamentos (
    cessao_id, numero_parcela, valor, data_vencimento, data_pagamento,
    tipo, is_reversal, reversal_of, observacoes, created_by
  ) values (
    v_origem.cessao_id, v_origem.numero_parcela, v_origem.valor,
    v_origem.data_vencimento, current_date,
    'estorno', true, v_origem.id,
    'ESTORNO: ' || p_motivo,
    auth.uid()
  )
  returning * into v_estorno;

  insert into public.logs_auditoria (user_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
  values (auth.uid(), 'estornar_pagamento', 'pagamento', v_origem.id,
          to_jsonb(v_origem), to_jsonb(v_estorno));

  return v_estorno;
end;
$$;

-- ------------------------------------------------------------
-- 4. Bucket de Storage para comprovantes
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes',
  'comprovantes',
  false,
  10 * 1024 * 1024,                     -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Policies de Storage: somente autenticados leem/escrevem
create policy "comprovantes: autenticados leem"
  on storage.objects for select
  using (bucket_id = 'comprovantes' and auth.uid() is not null);

create policy "comprovantes: autenticados enviam"
  on storage.objects for insert
  with check (bucket_id = 'comprovantes' and auth.uid() is not null);

create policy "comprovantes: dono ou admin atualiza"
  on storage.objects for update
  using (
    bucket_id = 'comprovantes'
    and (owner = auth.uid() or public.current_user_role() = 'admin')
  );

create policy "comprovantes: dono ou admin deleta"
  on storage.objects for delete
  using (
    bucket_id = 'comprovantes'
    and (owner = auth.uid() or public.current_user_role() = 'admin')
  );
