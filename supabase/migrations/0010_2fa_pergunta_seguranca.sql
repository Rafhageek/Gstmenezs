-- ============================================================
-- Painel MNZ — Migration 0010
-- ============================================================
-- 2FA via pergunta de seguranca pessoal.
--
-- Fluxo: apos login com senha, sistema pergunta algo pessoal
-- (ex: "nome da filha(a)") antes de liberar o dashboard.
--
-- Resposta e normalizada (lowercase + sem acentos + sem espacos
-- extras) e hasheada com bcrypt (pgcrypto) antes de guardar.
-- ============================================================

alter table public.profiles
  add column if not exists pergunta_seguranca text,
  add column if not exists resposta_seguranca_hash text;

comment on column public.profiles.pergunta_seguranca is
  'Pergunta personalizada exibida na tela de 2FA apos login';
comment on column public.profiles.resposta_seguranca_hash is
  'Hash bcrypt da resposta normalizada (lowercase/sem acentos)';

-- ------------------------------------------------------------
-- Normalizar resposta: lowercase + unaccent + trim + colapso espacos
-- ------------------------------------------------------------

create extension if not exists "unaccent";

create or replace function public.normalizar_resposta_seguranca(p_texto text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    lower(unaccent(trim(p_texto))),
    '\s+', '', 'g'
  );
$$;

comment on function public.normalizar_resposta_seguranca(text) is
  'Padroniza resposta de seguranca: lowercase, sem acentos, sem espacos';

-- ------------------------------------------------------------
-- Definir pergunta+resposta para o usuario corrente
-- ------------------------------------------------------------

create or replace function public.definir_pergunta_seguranca(
  p_pergunta text,
  p_resposta text
)
returns void
language plpgsql
security definer
set search_path = public
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
-- Remover pergunta (desligar 2FA por pergunta)
-- ------------------------------------------------------------

create or replace function public.remover_pergunta_seguranca()
returns void
language plpgsql
security definer
set search_path = public
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
-- Verificar resposta — retorna true/false
-- ------------------------------------------------------------

create or replace function public.verificar_resposta_seguranca(p_resposta text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_resposta_norm text;
begin
  if auth.uid() is null then
    return false;
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
-- Seed: Dr. Jairo (contato@menezesadvocacia.com)
-- Pergunta: "Qual o nome da sua filha(o)?"
-- Resposta normalizada: "larinhamenezes"
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
           resposta_seguranca_hash = crypt(
             public.normalizar_resposta_seguranca('Larinha Menezes'),
             gen_salt('bf', 10)
           )
     where id = v_user_id;
  end if;
end;
$$;
