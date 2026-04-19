-- ============================================================
-- Painel MNZ — Migration 0005
-- ============================================================
-- 1. Tabela configuracoes: dados do escritório (aparecem nos PDFs)
-- 2. Coluna valor_original em pagamentos + pagamento parcial
-- 3. Função registrar_pagamento_parcial (cria parcela de saldo)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Configurações do escritório
-- ------------------------------------------------------------

create table if not exists public.configuracoes (
  id integer primary key default 1,
  razao_social text not null default 'Menezes Advocacia',
  nome_fantasia text,
  cnpj text,
  oab text,
  endereco jsonb,
  telefone text,
  email text,
  site text,
  logo_url text,
  cor_primaria text default '#c9a961',
  legenda_pdf text default 'Documento gerado pelo sistema Painel MNZ — uso interno do escritório',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint configuracoes_singleton check (id = 1)
);

insert into public.configuracoes (id) values (1) on conflict do nothing;

comment on table public.configuracoes is 'Singleton com dados do escritório usados em relatórios';

alter table public.configuracoes enable row level security;

create policy "configuracoes: autenticados leem"
  on public.configuracoes for select
  using (auth.uid() is not null);

create policy "configuracoes: apenas admin altera"
  on public.configuracoes for update
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create trigger trg_configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2. Pagamento parcial: valor_original e auto-geração de saldo
-- ------------------------------------------------------------

alter table public.pagamentos
  add column if not exists valor_original numeric(15,2);

-- Popula valor_original para registros existentes
update public.pagamentos
   set valor_original = valor
 where valor_original is null;

alter table public.pagamentos
  alter column valor_original set not null;

-- Ajusta o trigger que gera parcelas para preencher valor_original
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
  v_valor numeric(15,2);
  i integer;
begin
  v_valor_parcela := round(new.valor_total / new.parcelas_total, 2);
  v_resto := new.valor_total - (v_valor_parcela * new.parcelas_total);

  for i in 1..new.parcelas_total loop
    v_data := (new.data_vencimento_inicial::date + ((i - 1) || ' months')::interval)::date;
    v_valor := case
      when i = new.parcelas_total then v_valor_parcela + v_resto
      else v_valor_parcela
    end;

    insert into public.pagamentos (
      cessao_id, numero_parcela, valor, valor_original,
      data_vencimento, tipo, created_by
    ) values (
      new.id, i, v_valor, v_valor, v_data, 'parcela', new.created_by
    );
  end loop;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. RPC: pagamento parcial (gera parcela de saldo automaticamente)
-- ------------------------------------------------------------

create or replace function public.registrar_pagamento_parcial(
  p_pagamento_id uuid,
  p_data_pagamento date,
  p_valor_recebido numeric,
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
  v_saldo numeric(15,2);
begin
  select * into v_original from public.pagamentos where id = p_pagamento_id;
  if not found then
    raise exception 'Pagamento % não encontrado', p_pagamento_id;
  end if;
  if v_original.data_pagamento is not null then
    raise exception 'Pagamento já foi registrado anteriormente';
  end if;
  if p_valor_recebido <= 0 then
    raise exception 'Valor recebido deve ser positivo';
  end if;
  if p_valor_recebido > v_original.valor then
    raise exception 'Valor recebido (%) maior que o valor da parcela (%)',
      p_valor_recebido, v_original.valor;
  end if;

  v_saldo := v_original.valor - p_valor_recebido;

  -- Atualiza a parcela original com o valor realmente recebido
  update public.pagamentos
     set data_pagamento = p_data_pagamento,
         valor = p_valor_recebido,
         observacoes = coalesce(p_observacoes, observacoes)
   where id = p_pagamento_id
  returning * into v_atualizado;

  -- Cria parcela de saldo (se houver diferença)
  if v_saldo > 0 then
    insert into public.pagamentos (
      cessao_id, numero_parcela, valor, valor_original,
      data_vencimento, tipo, observacoes, created_by
    ) values (
      v_original.cessao_id,
      v_original.numero_parcela,
      v_saldo,
      v_saldo,
      v_original.data_vencimento,
      'ajuste',
      'Saldo da parcela ' || v_original.numero_parcela
        || ' (pagamento parcial de ' || to_char(p_data_pagamento, 'DD/MM/YYYY') || ')',
      auth.uid()
    );
  end if;

  insert into public.logs_auditoria (
    user_id, acao, entidade, entidade_id, dados_anteriores, dados_novos
  ) values (
    auth.uid(),
    'pagamento_parcial',
    'pagamento',
    p_pagamento_id,
    to_jsonb(v_original),
    to_jsonb(v_atualizado)
  );

  return v_atualizado;
end;
$$;

-- ------------------------------------------------------------
-- 4. Atualiza view v_cessoes_resumo: inclui cliente_id (útil p/ filtros)
-- ------------------------------------------------------------

create or replace view public.v_cessoes_resumo as
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

-- ------------------------------------------------------------
-- 5. View de eventos (timeline) de cada cessão
-- ------------------------------------------------------------

create or replace view public.v_timeline_cessao as
-- Criação da cessão
select
  c.id as cessao_id,
  c.created_at as evento_em,
  'cessao_criada' as tipo,
  'Cessão criada: ' || c.valor_total || ' em ' || c.parcelas_total || ' parcelas' as descricao,
  c.valor_total as valor
from public.cessoes_credito c
union all
-- Pagamentos efetivados
select
  p.cessao_id,
  (p.data_pagamento::timestamp + (p.created_at::time)) as evento_em,
  case
    when p.is_reversal then 'estorno'
    when p.tipo = 'ajuste' then 'pagamento_parcial'
    else 'pagamento'
  end as tipo,
  case
    when p.is_reversal then 'Estorno da parcela ' || p.numero_parcela
    when p.tipo = 'ajuste' then 'Saldo da parcela ' || p.numero_parcela || ' gerado'
    else 'Parcela ' || p.numero_parcela || ' paga'
  end as descricao,
  p.valor
from public.pagamentos p
where p.data_pagamento is not null or p.tipo = 'ajuste'
union all
-- Status mudou para cancelada (via log de auditoria)
select
  (l.entidade_id)::uuid as cessao_id,
  l.created_at as evento_em,
  'cancelada' as tipo,
  'Cessão cancelada' as descricao,
  null::numeric as valor
from public.logs_auditoria l
where l.entidade = 'cessoes_credito'
  and l.acao = 'update'
  and (l.dados_anteriores->>'status') != 'cancelada'
  and (l.dados_novos->>'status') = 'cancelada'
order by evento_em desc;

comment on view public.v_timeline_cessao is 'Eventos por cessão em ordem cronológica reversa';
