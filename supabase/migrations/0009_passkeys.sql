-- ============================================================
-- Painel MNZ — Migration 0009
-- ============================================================
-- Passkeys (WebAuthn) para desbloqueio biometrico.
--
-- Modelo: sessao Supabase continua sendo fonte de verdade.
-- Passkey e uma CAMADA LOCAL de desbloqueio — apos login fresh
-- com senha, usuario pode cadastrar Face ID/Touch ID/impressao
-- digital. Nas proximas aberturas do app (dentro do mesmo ciclo
-- de sessao), sistema pede biometria em vez de senha.
-- ============================================================

create table if not exists public.passkeys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,            -- base64url encoded
  counter bigint not null default 0,
  device_type text,                     -- singleDevice | multiDevice
  backed_up boolean not null default false,
  transports text[],
  nome_dispositivo text not null,       -- ex: "iPhone 14 Pro"
  aaguid text,
  created_at timestamptz not null default now(),
  ultimo_uso_em timestamptz
);

create index if not exists idx_passkeys_user on public.passkeys(user_id);
create index if not exists idx_passkeys_credential
  on public.passkeys(credential_id);

comment on table public.passkeys is
  'Credenciais WebAuthn vinculadas a usuarios (Face ID, Touch ID, biometria)';

alter table public.passkeys enable row level security;

drop policy if exists "passkeys: usuario ve as proprias" on public.passkeys;
create policy "passkeys: usuario ve as proprias"
  on public.passkeys for select
  using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "passkeys: usuario gerencia as proprias" on public.passkeys;
create policy "passkeys: usuario gerencia as proprias"
  on public.passkeys for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Tabela temporaria para challenges (anti-replay)
create table if not exists public.passkey_challenges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  challenge text not null,
  tipo text not null check (tipo in ('register', 'authenticate')),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

alter table public.passkey_challenges enable row level security;

drop policy if exists "challenges: usuario ve proprio" on public.passkey_challenges;
create policy "challenges: usuario ve proprio"
  on public.passkey_challenges for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Limpeza automatica de challenges expirados (opcional — nao critico)
create or replace function public.limpar_challenges_expirados()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.passkey_challenges where expires_at < now();
$$;
