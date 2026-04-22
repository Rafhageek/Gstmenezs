-- ============================================================
-- Painel MNZ — Migration 0017 (fix)
-- ============================================================
-- Corrige erro "function gen_random_bytes(integer) does not exist"
-- ao criar links do portal do contador.
--
-- Causa: no Supabase, pgcrypto fica no schema `extensions`, mas a
-- função criar_portal_link estava com search_path = public apenas,
-- e chamava gen_random_bytes sem qualificar.
--
-- Fix: incluir `extensions` no search_path E qualificar explicitamente.
-- (Mesmo padrão aplicado ao 2FA em 0012.)
-- ============================================================

create or replace function public.criar_portal_link(
  p_cliente_id uuid,
  p_descricao text,
  p_validade_dias integer default 30
)
returns public.portal_links
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
  v_link public.portal_links;
  v_user_role user_role;
begin
  select role into v_user_role from public.profiles where id = auth.uid();
  if v_user_role != 'admin' then
    raise exception 'Apenas administradores podem criar links do portal';
  end if;

  v_token := encode(extensions.gen_random_bytes(30), 'hex');

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
  'Cria novo link de portal para um cliente. Apenas admin. Qualifica extensions.gen_random_bytes.';
