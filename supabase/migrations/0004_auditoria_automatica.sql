-- ============================================================
-- Painel MNZ — Migration 0004
-- ============================================================
-- Auditoria automática: triggers que gravam em logs_auditoria
-- toda mutação em tabelas de domínio.
--
-- A captura no banco garante registro mesmo se a aplicação for
-- modificada ou se alguém acessar via API direta.
-- ============================================================

-- ------------------------------------------------------------
-- Função genérica de auditoria
-- ------------------------------------------------------------

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acao text;
  v_anteriores jsonb;
  v_novos jsonb;
  v_id uuid;
begin
  -- Determina ação
  if (tg_op = 'INSERT') then
    v_acao := 'create';
    v_anteriores := null;
    v_novos := to_jsonb(new);
    v_id := (new.id)::uuid;
  elsif (tg_op = 'UPDATE') then
    v_acao := 'update';
    v_anteriores := to_jsonb(old);
    v_novos := to_jsonb(new);
    v_id := (new.id)::uuid;
  elsif (tg_op = 'DELETE') then
    v_acao := 'delete';
    v_anteriores := to_jsonb(old);
    v_novos := null;
    v_id := (old.id)::uuid;
  end if;

  -- Não loga se a única mudança foi updated_at (evita ruído)
  if (tg_op = 'UPDATE') then
    if (v_anteriores - 'updated_at') = (v_novos - 'updated_at') then
      return coalesce(new, old);
    end if;
  end if;

  insert into public.logs_auditoria (
    user_id,
    acao,
    entidade,
    entidade_id,
    dados_anteriores,
    dados_novos
  ) values (
    auth.uid(),
    v_acao,
    tg_table_name,
    v_id,
    v_anteriores,
    v_novos
  );

  return coalesce(new, old);
end;
$$;

comment on function public.audit_trigger() is
  'Trigger genérico de auditoria — registra create/update/delete em logs_auditoria';

-- ------------------------------------------------------------
-- Aplica triggers nas tabelas de domínio
-- ------------------------------------------------------------

create trigger trg_audit_clientes_principais
  after insert or update or delete on public.clientes_principais
  for each row execute function public.audit_trigger();

create trigger trg_audit_cessionarios
  after insert or update or delete on public.cessionarios
  for each row execute function public.audit_trigger();

create trigger trg_audit_cessoes_credito
  after insert or update or delete on public.cessoes_credito
  for each row execute function public.audit_trigger();

create trigger trg_audit_pagamentos
  after insert or update or delete on public.pagamentos
  for each row execute function public.audit_trigger();

create trigger trg_audit_profiles
  after update or delete on public.profiles
  for each row execute function public.audit_trigger();

-- ------------------------------------------------------------
-- View enriquecida: logs com info do usuário
-- ------------------------------------------------------------

create or replace view public.v_logs_auditoria as
select
  l.id,
  l.user_id,
  coalesce(p.nome, l.user_id::text) as user_nome,
  p.email as user_email,
  p.role as user_role,
  l.acao,
  l.entidade,
  l.entidade_id,
  l.dados_anteriores,
  l.dados_novos,
  l.ip_address,
  l.user_agent,
  l.created_at
from public.logs_auditoria l
left join public.profiles p on p.id = l.user_id
order by l.created_at desc;

comment on view public.v_logs_auditoria is
  'Logs de auditoria enriquecidos com nome/role do autor';
