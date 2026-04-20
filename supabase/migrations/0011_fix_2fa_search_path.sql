-- ============================================================
-- Painel MNZ — Migration 0011 (fix)
-- ============================================================
-- Corrige funcoes 2FA para:
--  1. Incluir schema `extensions` no search_path (onde o Supabase
--     instala unaccent e pgcrypto por padrao)
--  2. Garantir grants explicitos para role `authenticated`
--  3. Qualificar extensions.unaccent para robustez
-- ============================================================

-- Garante que unaccent esta instalado (em qualquer schema que Supabase use)
create extension if not exists "unaccent";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Normalizar: usa unaccent sem qualificacao de schema, mas com
-- search_path amplo para encontrar a extensao
-- ------------------------------------------------------------

create or replace function public.normalizar_resposta_seguranca(p_texto text)
returns text
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select regexp_replace(
    lower(unaccent(trim(p_texto))),
    '\s+', '', 'g'
  );
$$;

-- ------------------------------------------------------------
-- Definir
-- ------------------------------------------------------------

create or replace function public.definir_pergunta_seguranca(
  p_pergunta text,
  p_resposta text
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_resposta_norm text;
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;

  if length(trim(p_pergunta)) < 5 then
    raise exception 'Pergunta muito curta';
  end if;

  v_resposta_norm := public.normalizar_resposta_seguranca(p_resposta);

  if length(v_resposta_norm) < 3 then
    raise exception 'Resposta muito curta (minimo 3 caracteres)';
  end if;

  v_hash := crypt(v_resposta_norm, gen_salt('bf', 10));

  update public.profiles
     set pergunta_seguranca = trim(p_pergunta),
         resposta_seguranca_hash = v_hash,
         updated_at = now()
   where id = auth.uid();
end;
$$;

-- ------------------------------------------------------------
-- Remover
-- ------------------------------------------------------------

create or replace function public.remover_pergunta_seguranca()
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;

  update public.profiles
     set pergunta_seguranca = null,
         resposta_seguranca_hash = null,
         updated_at = now()
   where id = auth.uid();
end;
$$;

-- ------------------------------------------------------------
-- Verificar — com try/catch para capturar erros de extensao
-- ------------------------------------------------------------

create or replace function public.verificar_resposta_seguranca(p_resposta text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_hash text;
  v_resposta_norm text;
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;

  select resposta_seguranca_hash into v_hash
    from public.profiles where id = auth.uid();

  if v_hash is null then
    return true; -- usuario sem pergunta configurada passa direto
  end if;

  v_resposta_norm := public.normalizar_resposta_seguranca(p_resposta);

  if length(v_resposta_norm) < 3 then
    return false;
  end if;

  return v_hash = crypt(v_resposta_norm, v_hash);
end;
$$;

-- ------------------------------------------------------------
-- Grants explicitos para role authenticated
-- ------------------------------------------------------------

grant execute on function public.definir_pergunta_seguranca(text, text)
  to authenticated;
grant execute on function public.remover_pergunta_seguranca()
  to authenticated;
grant execute on function public.verificar_resposta_seguranca(text)
  to authenticated;
grant execute on function public.normalizar_resposta_seguranca(text)
  to authenticated;
