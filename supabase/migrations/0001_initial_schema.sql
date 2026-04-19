-- ============================================================
-- Painel MNZ — Schema Inicial
-- ============================================================
-- Tabelas: clientes_principais, cessionarios, cessoes_credito,
--          pagamentos, logs_auditoria
-- Segurança: RLS habilitado em todas as tabelas
-- Auditoria: logs_auditoria registra todo acesso/mudança
-- ============================================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type public.user_role as enum ('admin', 'financeiro', 'contador');
create type public.cessao_status as enum ('ativa', 'quitada', 'inadimplente', 'cancelada');
create type public.pagamento_tipo as enum ('parcela', 'estorno', 'ajuste');

-- ============================================================
-- PROFILES (espelha auth.users + role)
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  role public.user_role not null default 'financeiro',
  oab text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil estendido dos usuários (advogados/financeiro/contador)';

-- ============================================================
-- CLIENTES PRINCIPAIS (cedentes do crédito)
-- ============================================================

create table public.clientes_principais (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  documento text not null unique,         -- CPF/CNPJ (criptografar em camada superior se necessário)
  email text,
  telefone text,
  endereco jsonb,
  observacoes text,
  ativo boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clientes_principais_documento on public.clientes_principais(documento);
create index idx_clientes_principais_ativo on public.clientes_principais(ativo);

-- ============================================================
-- CESSIONÁRIOS (recebedores da cessão)
-- ============================================================

create table public.cessionarios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  documento text not null,
  email text,
  telefone text,
  endereco jsonb,
  banco jsonb,                            -- { banco, agencia, conta, tipo, pix }
  observacoes text,
  ativo boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (documento)
);

create index idx_cessionarios_documento on public.cessionarios(documento);
create index idx_cessionarios_ativo on public.cessionarios(ativo);

-- ============================================================
-- CESSÕES DE CRÉDITO (contrato/escritura)
-- ============================================================

create table public.cessoes_credito (
  id uuid primary key default uuid_generate_v4(),
  numero_contrato text not null unique,
  cliente_principal_id uuid not null references public.clientes_principais(id) on delete restrict,
  cessionario_id uuid not null references public.cessionarios(id) on delete restrict,
  valor_total numeric(15,2) not null check (valor_total > 0),
  valor_pago numeric(15,2) not null default 0 check (valor_pago >= 0),
  parcelas_total integer not null default 1 check (parcelas_total > 0),
  data_cessao date not null,
  data_vencimento_inicial date not null,
  status public.cessao_status not null default 'ativa',
  taxa_juros numeric(8,4) default 0,      -- % ao mês
  observacoes text,
  documento_url text,                     -- escritura em PDF (Supabase Storage)
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cessoes_cliente on public.cessoes_credito(cliente_principal_id);
create index idx_cessoes_cessionario on public.cessoes_credito(cessionario_id);
create index idx_cessoes_status on public.cessoes_credito(status);
create index idx_cessoes_data_vencimento on public.cessoes_credito(data_vencimento_inicial);

-- ============================================================
-- PAGAMENTOS
-- ============================================================

create table public.pagamentos (
  id uuid primary key default uuid_generate_v4(),
  cessao_id uuid not null references public.cessoes_credito(id) on delete restrict,
  numero_parcela integer not null check (numero_parcela > 0),
  valor numeric(15,2) not null check (valor > 0),
  data_vencimento date not null,
  data_pagamento date,
  tipo public.pagamento_tipo not null default 'parcela',
  comprovante_url text,                   -- PDF no Supabase Storage
  is_reversal boolean not null default false,
  reversal_of uuid references public.pagamentos(id),
  observacoes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pagamentos_cessao on public.pagamentos(cessao_id);
create index idx_pagamentos_vencimento on public.pagamentos(data_vencimento);
create index idx_pagamentos_pagamento on public.pagamentos(data_pagamento);
create index idx_pagamentos_pago on public.pagamentos(cessao_id) where data_pagamento is not null;

-- ============================================================
-- LOGS DE AUDITORIA (insert-only)
-- ============================================================

create table public.logs_auditoria (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  acao text not null,                     -- 'create', 'update', 'delete', 'view', 'login', 'logout'
  entidade text not null,                 -- 'cessao_credito', 'pagamento', etc.
  entidade_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_logs_user on public.logs_auditoria(user_id);
create index idx_logs_entidade on public.logs_auditoria(entidade, entidade_id);
create index idx_logs_created on public.logs_auditoria(created_at desc);

-- ============================================================
-- TRIGGERS — updated_at automático
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_clientes_principais_updated_at
  before update on public.clientes_principais
  for each row execute function public.set_updated_at();

create trigger trg_cessionarios_updated_at
  before update on public.cessionarios
  for each row execute function public.set_updated_at();

create trigger trg_cessoes_updated_at
  before update on public.cessoes_credito
  for each row execute function public.set_updated_at();

create trigger trg_pagamentos_updated_at
  before update on public.pagamentos
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER — recalcula valor_pago da cessão quando pagamento muda
-- ============================================================

create or replace function public.recalcular_valor_pago_cessao()
returns trigger
language plpgsql
as $$
declare
  v_cessao_id uuid;
  v_total_pago numeric(15,2);
begin
  v_cessao_id := coalesce(new.cessao_id, old.cessao_id);

  -- Soma pagamentos efetivados (data_pagamento not null) menos estornos
  select coalesce(sum(
    case
      when is_reversal then -valor
      else valor
    end
  ), 0)
  into v_total_pago
  from public.pagamentos
  where cessao_id = v_cessao_id
    and data_pagamento is not null;

  update public.cessoes_credito
  set valor_pago = v_total_pago,
      status = case
        when v_total_pago >= valor_total then 'quitada'::public.cessao_status
        else status
      end
  where id = v_cessao_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_pagamento_recalcula_cessao
  after insert or update or delete on public.pagamentos
  for each row execute function public.recalcular_valor_pago_cessao();

-- ============================================================
-- TRIGGER — auto-criar profile ao registrar usuário
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    'financeiro'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- VIEW — dashboard financeiro
-- ============================================================

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
  cp.nome as cliente_nome,
  ce.nome as cessionario_nome,
  (
    select min(p.data_vencimento)
    from public.pagamentos p
    where p.cessao_id = c.id
      and p.data_pagamento is null
      and p.data_vencimento < current_date
  ) as primeira_parcela_atrasada
from public.cessoes_credito c
join public.clientes_principais cp on cp.id = c.cliente_principal_id
join public.cessionarios ce on ce.id = c.cessionario_id;

comment on view public.v_cessoes_resumo is 'Resumo financeiro por cessão para o dashboard';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Estratégia: usuários autenticados (qualquer role) podem ler.
-- Apenas admin/financeiro podem escrever.
-- Logs de auditoria são insert-only (ninguém pode editar/apagar).
-- Refinar políticas conforme necessidades específicas surgirem.

alter table public.profiles enable row level security;
alter table public.clientes_principais enable row level security;
alter table public.cessionarios enable row level security;
alter table public.cessoes_credito enable row level security;
alter table public.pagamentos enable row level security;
alter table public.logs_auditoria enable row level security;

-- Helper: pega role do usuário corrente
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: usuário é admin ou financeiro?
create or replace function public.can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'financeiro');
$$;

-- ----- profiles -----
create policy "profiles: usuário vê o próprio perfil"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles: admin atualiza qualquer; outros, apenas o próprio"
  on public.profiles for update
  using (id = auth.uid() or public.current_user_role() = 'admin')
  with check (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles: apenas admin insere"
  on public.profiles for insert
  with check (public.current_user_role() = 'admin');

-- ----- clientes_principais -----
create policy "clientes: autenticados leem"
  on public.clientes_principais for select
  using (auth.uid() is not null);

create policy "clientes: admin/financeiro escrevem"
  on public.clientes_principais for all
  using (public.can_write())
  with check (public.can_write());

-- ----- cessionarios -----
create policy "cessionarios: autenticados leem"
  on public.cessionarios for select
  using (auth.uid() is not null);

create policy "cessionarios: admin/financeiro escrevem"
  on public.cessionarios for all
  using (public.can_write())
  with check (public.can_write());

-- ----- cessoes_credito -----
create policy "cessoes: autenticados leem"
  on public.cessoes_credito for select
  using (auth.uid() is not null);

create policy "cessoes: admin/financeiro escrevem"
  on public.cessoes_credito for all
  using (public.can_write())
  with check (public.can_write());

-- ----- pagamentos -----
create policy "pagamentos: autenticados leem"
  on public.pagamentos for select
  using (auth.uid() is not null);

create policy "pagamentos: admin/financeiro escrevem"
  on public.pagamentos for all
  using (public.can_write())
  with check (public.can_write());

-- ----- logs_auditoria (insert-only) -----
create policy "logs: autenticados leem"
  on public.logs_auditoria for select
  using (auth.uid() is not null);

create policy "logs: autenticados inserem"
  on public.logs_auditoria for insert
  with check (auth.uid() is not null);

-- Sem policy de update/delete = ninguém pode alterar (insert-only).
