-- ─────────────────────────────────────────────────────────────────────────
-- Producti: accounts and synced data.
--
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again: everything is "if not exists" / "or replace".
--
-- Security model
--   • Emails and passwords live only in Supabase Auth (auth.users), which the
--     public API cannot read. No table here stores an email, so no query can
--     list other people's emails.
--   • Row-level security is on for every table. A user can read and write
--     only their own synced data. Profiles (username + full name, nothing
--     else) are readable by signed-in users so friends can find each other.
--   • Profiles are created by a trigger from sign-up data, never inserted
--     directly by the client.
-- ─────────────────────────────────────────────────────────────────────────

-- Public profile: what other signed-in users may see.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  full_name text not null check (char_length(full_name) between 2 and 40),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Signed-in users can read profiles" on public.profiles;
create policy "Signed-in users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert or delete policies: rows come from the trigger below and go
-- away with the account (on delete cascade).

-- Each user's habits, history and settings, synced from the app.
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  schema_version integer not null check (schema_version between 1 and 1000),
  updated_at timestamptz not null default now(),
  -- About 1 MB per user is far more than the app ever needs.
  constraint user_state_size check (pg_column_size(state) < 1048576)
);

alter table public.user_state enable row level security;

drop policy if exists "Users can read their own data" on public.user_state;
create policy "Users can read their own data"
  on public.user_state for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own data" on public.user_state;
create policy "Users can create their own data"
  on public.user_state for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own data" on public.user_state;
create policy "Users can update their own data"
  on public.user_state for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Anonymous visitors get nothing from either table.
revoke all on public.profiles from anon;
revoke all on public.user_state from anon;

-- Create the profile when someone signs up, from the name and username they
-- entered. If the username is taken, sign-up fails and the app says so.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up form check a username before submitting. Returns only
-- true/false, so it can't be used to list users.
create or replace function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where username = lower(name));
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Account deletion (required by app stores): a signed-in user can delete
-- their own account. Deleting the auth user cascades to their profile and
-- synced data. It can only ever delete the caller.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
