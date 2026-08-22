-- Links each learner to a personal commander, and lets a commander tag an
-- exercise as a formal test vs a practice exercise.

alter table public.exercises
  add column if not exists mode text not null default 'exercise' check (mode in ('exercise', 'test'));

alter table public.profiles
  add column if not exists commander_id uuid references public.profiles (id);

-- A learner's commander_id must point at an actual commander, not another
-- learner or a nonexistent row. Enforced here (not just app-side) since the
-- signup trigger below runs as SECURITY DEFINER and bypasses RLS.
create or replace function public.validate_commander_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.commander_id is not null then
    if not exists (
      select 1 from public.profiles where id = new.commander_id and role = 'commander'
    ) then
      raise exception 'commander_id must reference a commander';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_commander_id on public.profiles;

create trigger profiles_validate_commander_id
  before insert or update on public.profiles
  for each row execute procedure public.validate_commander_id();

-- Anyone (including anonymous visitors on the signup page, before they have
-- an account) can see the list of commanders, so a learner can pick their
-- own commander at signup. Only role='commander' rows are exposed by this
-- policy — a learner still cannot browse other learners' profiles.
create policy "profiles_select_commanders_public"
  on public.profiles for select
  using (role = 'commander');

-- commander_id is only ever set once, at signup time by the trigger below —
-- block direct client-side changes, same reasoning as the existing role
-- guard. (A future "reassign learner to a different commander" admin
-- feature will need a dedicated SECURITY DEFINER RPC, not a plain update,
-- exactly like the existing role-change caveat.)
create or replace function public.prevent_role_self_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed directly';
  end if;
  if new.commander_id is distinct from old.commander_id then
    raise exception 'commander_id cannot be changed directly';
  end if;
  return new;
end;
$$;

-- Store commander_id from signUp()'s options.data metadata, alongside the
-- fields the original trigger already handled.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, native_language, commander_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'learner'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'native_language',
    nullif(new.raw_user_meta_data ->> 'commander_id', '')::uuid
  );
  return new;
end;
$$;

-- A learner should only see exercises from their own linked commander; a
-- commander should still see their own exercises. Replaces the old
-- "any authenticated user sees any exercise" policy.
drop policy if exists "exercises_select_authenticated" on public.exercises;

create policy "exercises_select_relevant"
  on public.exercises for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.commander_id = exercises.created_by
    )
  );
