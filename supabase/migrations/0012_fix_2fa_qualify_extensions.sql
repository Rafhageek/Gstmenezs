-- ============================================================
-- Painel MNZ — Migration 0012 (fix)
-- ============================================================
-- Supabase instala pgcrypto/unaccent no schema `extensions`.
-- Mesmo com search_path incluindo `extensions`, algumas funcoes
-- nao sao resolvidas corretamente quando chamadas de dentro de
-- outra funcao SECURITY DEFINER.
--
-- Solucao: qualificar EXPLICITAMENTE com prefixo `extensions.`
-- em crypt, gen_salt e unaccent.
-- ============================================================

-- ------------------------------------------------------------
-- Normalizar: usa extensions.unaccent qualificado
-- ------------------------------------------------------------

create or replace function public.normalizar_resposta_seguranca(p_texto text)
returns text
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select regexp_replace(
    lower(extensions.unaccent(trim(p_texto))),
    '\s+', '', 'g'
  );
$$;

-- ------------------------------------------------------------
-- Definir — extensions.crypt + extensions.gen_salt qualificados
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

  v_hash := extensions.crypt(v_resposta_norm, extensions.gen_salt('bf', 10));

  update public.profiles
     set pergunta_seguranca = trim(p_pergunta),
         resposta_seguranca_hash = v_hash,
         updated_at = now()
   where id = auth.uid();
end;
$$;

-- ------------------------------------------------------------
-- Verificar — extensions.crypt qualificado
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

  return v_hash = extensions.crypt(v_resposta_norm, v_hash);
end;
$$;

-- ------------------------------------------------------------
-- Re-seed: Dr. Jairo com o novo hash (gerado com crypt qualificado)
-- Garante que o hash existente eh compativel com a funcao de verificacao
-- ------------------------------------------------------------

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
    from auth.users
   where email = 'contato@menezesadvocacia.com'
   limit 1;

  if v_user_id is not null then
    update public.profiles
       set pergunta_seguranca = 'Qual o nome da sua filha(o)?',
           resposta_seguranca_hash = extensions.crypt(
             public.normalizar_resposta_seguranca('Larinha Menezes'),
             extensions.gen_salt('bf', 10)
           )
     where id = v_user_id;
  end if;
end;
$$;

-- Grants (idempotentes)
grant execute on function public.definir_pergunta_seguranca(text, text)
  to authenticated;
grant execute on function public.verificar_resposta_seguranca(text)
  to authenticated;
grant execute on function public.normalizar_resposta_seguranca(text)
  to authenticated;
