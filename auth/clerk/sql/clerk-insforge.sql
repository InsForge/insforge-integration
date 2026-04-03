-- Clerk JWT Template (HS256) + InsForge RLS helper
-- Aligned with JWT template flow using TEXT user_id columns.

create extension if not exists pgcrypto;

create or replace function public.requesting_user_id()
returns text
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  name text not null,
  website text,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default public.requesting_user_id(),
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  name text not null,
  stage text not null default 'new',
  amount numeric,
  close_date date,
  created_at timestamptz not null default now()
);

alter table public.companies alter column user_id set default public.requesting_user_id();
alter table public.contacts alter column user_id set default public.requesting_user_id();
alter table public.deals alter column user_id set default public.requesting_user_id();

do $$
begin
  if not exists (select 1 from public.companies where user_id is null limit 1) then
    execute 'alter table public.companies alter column user_id set not null';
  end if;

  if not exists (select 1 from public.contacts where user_id is null limit 1) then
    execute 'alter table public.contacts alter column user_id set not null';
  end if;

  if not exists (select 1 from public.deals where user_id is null limit 1) then
    execute 'alter table public.deals alter column user_id set not null';
  end if;
end
$$;

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;

drop policy if exists "Users can manage own companies" on public.companies;
drop policy if exists "Users can manage own contacts" on public.contacts;
drop policy if exists "Users can manage own deals" on public.deals;

create policy "Users can manage own companies"
  on public.companies
  for all
  to authenticated
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

create policy "Users can manage own contacts"
  on public.contacts
  for all
  to authenticated
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

create policy "Users can manage own deals"
  on public.deals
  for all
  to authenticated
  using (user_id = public.requesting_user_id())
  with check (user_id = public.requesting_user_id());

