-- The commander's space: soldier roster, graded attempts, per-soldier
-- assignments, and a reading-passage content type.

-- ---------------------------------------------------------------------------
-- Helper predicates. Both are SECURITY DEFINER so RLS policies on other tables
-- can ask "is this my soldier?" without needing (and without recursing into)
-- the profiles policies themselves.
-- ---------------------------------------------------------------------------

create or replace function public.is_commander()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'commander'
  );
$$;

create or replace function public.is_my_learner(learner uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = learner and commander_id = auth.uid()
  );
$$;

grant execute on function public.is_commander() to authenticated;
grant execute on function public.is_my_learner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Reading passages become a third exercise type.
-- The loop drops whichever check constraint currently pins the allowed types,
-- so this migration stays safe to re-run.
-- ---------------------------------------------------------------------------

do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'exercises'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%flashcards%'
  loop
    execute format('alter table public.exercises drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.exercises
  add constraint exercises_type_check check (type in ('flashcards', 'quiz', 'reading'));

-- ---------------------------------------------------------------------------
-- Graded attempts. Until now nothing about an exercise run was ever stored,
-- so a commander had no grades to look at.
-- ---------------------------------------------------------------------------

create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  created_at timestamptz not null default now()
);

create index if not exists exercise_attempts_user_created_idx
  on public.exercise_attempts (user_id, created_at);

alter table public.exercise_attempts enable row level security;

create policy "attempts_insert_own"
  on public.exercise_attempts for insert
  with check (auth.uid() = user_id);

create policy "attempts_select_own"
  on public.exercise_attempts for select
  using (auth.uid() = user_id);

create policy "attempts_select_commander"
  on public.exercise_attempts for select
  using (public.is_my_learner(user_id));

-- ---------------------------------------------------------------------------
-- Per-soldier assignments: a commander pushes a specific exercise / test /
-- reading passage to a specific soldier.
-- ---------------------------------------------------------------------------

create table if not exists public.exercise_assignments (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  learner_id uuid not null references auth.users (id) on delete cascade,
  assigned_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (exercise_id, learner_id)
);

alter table public.exercise_assignments enable row level security;

create policy "assignments_select_learner"
  on public.exercise_assignments for select
  using (auth.uid() = learner_id);

create policy "assignments_select_commander"
  on public.exercise_assignments for select
  using (auth.uid() = assigned_by);

create policy "assignments_insert_commander"
  on public.exercise_assignments for insert
  with check (auth.uid() = assigned_by and public.is_my_learner(learner_id));

create policy "assignments_delete_commander"
  on public.exercise_assignments for delete
  using (auth.uid() = assigned_by);

-- ---------------------------------------------------------------------------
-- Visibility for commanders.
-- ---------------------------------------------------------------------------

-- The soldier directory: every commander can see soldier profiles, so they can
-- find and claim their own people. Learners still cannot browse other learners.
create policy "profiles_select_learners_for_commanders"
  on public.profiles for select
  using (role = 'learner' and public.is_commander());

-- Lesson progress of one's own soldiers.
create policy "user_progress_select_commander"
  on public.user_progress for select
  using (public.is_my_learner(user_id));

-- ---------------------------------------------------------------------------
-- Linking a soldier to a commander.
--
-- profiles.commander_id is guarded by prevent_role_self_update() so nobody can
-- reassign themselves by writing to their own row. Linking therefore goes
-- through these SECURITY DEFINER RPCs, which set a transaction-local flag the
-- trigger honours. (SECURITY DEFINER alone would NOT bypass the trigger.)
-- ---------------------------------------------------------------------------

create or replace function public.prevent_role_self_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed directly';
  end if;
  if new.commander_id is distinct from old.commander_id
     and coalesce(current_setting('app.allow_commander_link', true), '') <> 'on' then
    raise exception 'commander_id cannot be changed directly';
  end if;
  return new;
end;
$$;

create or replace function public.link_learner_to_commander(learner uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_commander() then
    raise exception 'only a commander can link soldiers';
  end if;
  if not exists (select 1 from public.profiles where id = learner and role = 'learner') then
    raise exception 'target is not a learner';
  end if;

  perform set_config('app.allow_commander_link', 'on', true);
  update public.profiles set commander_id = auth.uid() where id = learner;
end;
$$;

create or replace function public.unlink_learner(learner uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_my_learner(learner) then
    raise exception 'this soldier is not linked to you';
  end if;

  perform set_config('app.allow_commander_link', 'on', true);
  update public.profiles set commander_id = null where id = learner;
end;
$$;

grant execute on function public.link_learner_to_commander(uuid) to authenticated;
grant execute on function public.unlink_learner(uuid) to authenticated;
