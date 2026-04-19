-- ============================================================
-- Painel MNZ — Migration 0007
-- ============================================================
-- Portal do contador: links únicos por cliente, sem necessidade
-- de cadastro. Acesso read-only, escopo limitado a 1 cliente,
-- com validade e revogação.
--
-- Modelo de segurança:
--   - Token é gerado via pgcrypto (60 chars hex = 240 bits)
--   - RPC valida_portal_token(token) é SECURITY DEFINER e retorna
--     cliente_id se o token for válido, NULL caso contrário
--   - Aplicação usa service_role para consultar dados APÓS validar
--     o token, sempre filtrando por cliente_id retornado
-- ============================================================

create table if not exists public.portal_links (
  id uuid primary key default uuid_generate_v4(),
  token text not null unique,
  cliente_id uuid not null references public.clientes_principais(id)
    on delete cascade,
  descricao text not null,
  expires_at timestamptz,
  revogado_em timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  ultimo_acesso_em timestamptz,
  acessos_total integer not null default 0
);

create index if not exists idx_portal_links_cliente on public.portal_links(cliente_id);
create index if not exists idx_portal_links_token on public.portal_links(token);

comment on table public.portal_links is
  'Links compartilháveis (read-only) para contadores acessarem dados de 1 cliente sem login';

alter table public.portal_links enable row level security;

drop policy if exists "portal_links: admin gerencia" on public.portal_links;
create policy "portal_links: admin gerencia"
  on public.portal_links for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- Gerar novo link (retorna o token em claro UMA VEZ)
-- ------------------------------------------------------------

create or replace function public.criar_portal_link(
  p_cliente_id uuid,
  p_descricao text,
  p_validade_dias integer default 30
)
returns public.portal_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_link public.portal_links;
  v_user_role user_role;
begin
  -- Apenas admin pode criar links
  select role into v_user_role from public.profiles where id = auth.uid();
  if v_user_role != 'admin' then
    raise exception 'Apenas administradores podem criar links do portal';
  end if;

  v_token := encode(gen_random_bytes(30), 'hex');

  insert into public.portal_links (
    token, cliente_id, descricao, expires_at, created_by
  ) values (
    v_token,
    p_cliente_id,
    p_descricao,
    case
      when p_validade_dias is null or p_validade_dias <= 0 then null
      else now() + (p_validade_dias || ' days')::interval
    end,
    auth.uid()
  ) returning * into v_link;

  insert into public.logs_auditoria (
    user_id, acao, entidade, entidade_id, dados_novos
  ) values (
    auth.uid(), 'criar_portal_link', 'portal_link', v_link.id, to_jsonb(v_link)
  );

  return v_link;
end;
$$;

comment on function public.criar_portal_link(uuid, text, integer) is
  'Cria novo link de portal para um cliente. Apenas admin.';

-- ------------------------------------------------------------
-- Revogar link (não deleta — preserva auditoria)
-- ------------------------------------------------------------

create or replace function public.revogar_portal_link(p_link_id uuid)
returns public.portal_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.portal_links;
  v_original public.portal_links;
begin
  if (select role from public.profiles where id = auth.uid()) != 'admin' then
    raise exception 'Apenas administradores podem revogar links';
  end if;

  select * into v_original from public.portal_links where id = p_link_id;
  if not found then
    raise exception 'Link % não encontrado', p_link_id;
  end if;

  update public.portal_links
     set revogado_em = now()
   where id = p_link_id
  returning * into v_link;

  insert into public.logs_auditoria (
    user_id, acao, entidade, entidade_id,
    dados_anteriores, dados_novos
  ) values (
    auth.uid(), 'revogar_portal_link', 'portal_link', p_link_id,
    to_jsonb(v_original), to_jsonb(v_link)
  );

  return v_link;
end;
$$;

-- ------------------------------------------------------------
-- Validar token (chamada sem autenticação)
-- ------------------------------------------------------------

create or replace function public.validar_portal_token(p_token text)
returns table (
  cliente_id uuid,
  cliente_nome text,
  descricao text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.portal_links;
begin
  select * into v_link from public.portal_links where token = p_token;
  if not found then
    return;
  end if;

  if v_link.revogado_em is not null then
    return;
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    return;
  end if;

  -- Registra acesso (best-effort — não falha se der erro)
  begin
    update public.portal_links
       set ultimo_acesso_em = now(),
           acessos_total = acessos_total + 1
     where id = v_link.id;
  exception when others then
    null;
  end;

  return query
  select
    v_link.cliente_id,
    cp.nome,
    v_link.descricao,
    v_link.expires_at
  from public.clientes_principais cp
  where cp.id = v_link.cliente_id;
end;
$$;

comment on function public.validar_portal_token(text) is
  'Valida token do portal. Retorna cliente_id+nome se válido, nada se inválido/expirado/revogado. Registra acesso.';

grant execute on function public.validar_portal_token(text) to anon;

-- ------------------------------------------------------------
-- View: links com status e nome do cliente (para tela admin)
-- ------------------------------------------------------------

create or replace view public.v_portal_links as
select
  pl.id,
  pl.token,
  pl.cliente_id,
  cp.nome as cliente_nome,
  pl.descricao,
  pl.expires_at,
  pl.revogado_em,
  pl.created_by,
  p.nome as criado_por_nome,
  pl.created_at,
  pl.ultimo_acesso_em,
  pl.acessos_total,
  case
    when pl.revogado_em is not null then 'revogado'
    when pl.expires_at is not null and pl.expires_at < now() then 'expirado'
    else 'ativo'
  end as status
from public.portal_links pl
join public.clientes_principais cp on cp.id = pl.cliente_id
left join public.profiles p on p.id = pl.created_by
order by pl.created_at desc;

comment on view public.v_portal_links is 'Links do portal com status e nome do cliente';
