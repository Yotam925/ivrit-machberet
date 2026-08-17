-- User profiles for עברית מחברת: extends auth.users with role, full name, and native language.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'learner' check (role in ('learner', 'commander')),
  full_name text not null,
  native_language text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The policy above only checks row ownership, not which columns change —
-- without this guard, any authenticated user could call
-- `.from('profiles').update({ role: 'commander' })` on their own row and
-- self-promote. Block direct changes to `role` via UPDATE; it may only be
-- set at signup time by the SECURITY DEFINER trigger below (INSERT only,
-- so this trigger does not affect it).
create or replace function public.prevent_role_self_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed directly';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_update();

-- Profile rows are created automatically by this trigger when a user signs up
-- (role / full_name / native_language come from signUp()'s options.data metadata),
-- so no insert policy is needed for the client — inserts only ever happen here,
-- as SECURITY DEFINER, which bypasses RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, native_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'learner'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'native_language'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
