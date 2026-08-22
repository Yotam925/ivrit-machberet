-- Hardening pass over the commander space.
--
-- The big one: until now `role` came straight from the signup form, so anyone
-- could tick "מפקד" and — once 0006 gave commanders a site-wide soldier
-- directory and access to grades — read every learner's details. Commanders
-- are now provisioned by invite code only.

-- ---------------------------------------------------------------------------
-- 1. Commander invite codes
-- ---------------------------------------------------------------------------

create table if not exists public.commander_invites (
  code text primary key,
  note text,
  active boolean not null default true,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.commander_invites enable row level security;
-- deliberately no policies: only SECURITY DEFINER functions may read or write

-- One random code so the existing owner can still onboard commanders. It is
-- generated here rather than hardcoded, so the value never lands in the repo;
-- commanders read it from their dashboard via list_commander_invites().
insert into public.commander_invites (code, note)
select upper(replace(gen_random_uuid()::text, '-', '')), 'קוד ראשוני'
where not exists (select 1 from public.commander_invites);

create or replace function public.list_commander_invites()
returns table (code text, note text, uses int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_commander() then
    raise exception 'only a commander can read invite codes';
  end if;
  return query
    select i.code, i.note, i.uses from public.commander_invites i where i.active;
end;
$$;

-- The signup trigger no longer trusts a client-supplied role. A new account is
-- a learner unless it presents a valid invite code in its signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_code text;
  v_role text := 'learner';
begin
  v_code := nullif(new.raw_user_meta_data ->> 'commander_invite', '');

  if v_code is not null and exists (
    select 1 from public.commander_invites where code = v_code and active
  ) then
    update public.commander_invites set uses = uses + 1 where code = v_code;
    v_role := 'commander';
  end if;

  insert into public.profiles (id, role, full_name, native_language, commander_id)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'native_language',
    case when v_role = 'learner'
      then nullif(new.raw_user_meta_data ->> 'commander_id', '')::uuid
      else null
    end
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Grade history must outlive the exercise it came from
-- ---------------------------------------------------------------------------

alter table public.exercise_attempts alter column exercise_id drop not null;

alter table public.exercise_attempts
  drop constraint if exists exercise_attempts_exercise_id_fkey;
alter table public.exercise_attempts
  add constraint exercise_attempts_exercise_id_fkey
  foreign key (exercise_id) references public.exercises (id) on delete set null;

-- snapshots, so a deleted or another commander's exercise still reads correctly
alter table public.exercise_attempts add column if not exists exercise_title text;
alter table public.exercise_attempts add column if not exists exercise_mode text;

alter table public.exercise_attempts
  drop constraint if exists exercise_attempts_score_lte_total;
alter table public.exercise_attempts
  add constraint exercise_attempts_score_lte_total check (score <= total);

-- ---------------------------------------------------------------------------
-- 3. Grading moves to the server. The client sends answers, never a score.
-- ---------------------------------------------------------------------------

drop policy if exists "attempts_insert_own" on public.exercise_attempts;

create or replace function public.record_attempt(p_exercise_id uuid, p_answers int[])
returns table (score int, total int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb;
  v_type text;
  v_title text;
  v_mode text;
  v_created_by uuid;
  v_total int;
  v_score int := 0;
  i int;
begin
  select e.items, e.type, e.title, e.mode, e.created_by
    into v_items, v_type, v_title, v_mode, v_created_by
  from public.exercises e
  where e.id = p_exercise_id;

  if v_items is null then
    raise exception 'exercise not found';
  end if;
  if v_type <> 'quiz' then
    raise exception 'only quizzes are graded';
  end if;

  -- only a soldier of the exercise's author may be graded on it
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.commander_id = v_created_by
  ) then
    raise exception 'not allowed';
  end if;

  v_total := jsonb_array_length(v_items);
  if v_total is null or v_total = 0 then
    raise exception 'empty quiz';
  end if;

  for i in 0 .. v_total - 1 loop
    if coalesce(p_answers[i + 1], -1) = (v_items -> i ->> 'correctIndex')::int then
      v_score := v_score + 1;
    end if;
  end loop;

  insert into public.exercise_attempts
    (exercise_id, user_id, score, total, exercise_title, exercise_mode)
  values (p_exercise_id, auth.uid(), v_score, v_total, v_title, v_mode);

  return query select v_score, v_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Assignments: the commander must own what they send
-- ---------------------------------------------------------------------------

drop policy if exists "assignments_insert_commander" on public.exercise_assignments;

create policy "assignments_insert_commander"
  on public.exercise_assignments for insert
  with check (
    auth.uid() = assigned_by
    and public.is_my_learner(learner_id)
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and e.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Linking: no seizing a soldier who already has a commander, and close the
--    trigger-bypass window as soon as the update is done.
-- ---------------------------------------------------------------------------

create or replace function public.link_learner_to_commander(learner uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_current uuid;
  v_role text;
begin
  if not public.is_commander() then
    raise exception 'only a commander can link soldiers';
  end if;

  select role, commander_id into v_role, v_current
  from public.profiles where id = learner;

  if v_role is distinct from 'learner' then
    raise exception 'target is not a learner';
  end if;
  if v_current is not null and v_current <> auth.uid() then
    raise exception 'soldier already belongs to another commander';
  end if;
  if v_current = auth.uid() then
    return; -- already mine; nothing to do
  end if;

  perform set_config('app.allow_commander_link', 'on', true);
  update public.profiles set commander_id = auth.uid() where id = learner;
  perform set_config('app.allow_commander_link', 'off', true);
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
  perform set_config('app.allow_commander_link', 'off', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Execute grants: revoke the implicit PUBLIC grant so anon cannot call these
-- ---------------------------------------------------------------------------

revoke execute on function public.is_commander() from public;
revoke execute on function public.is_my_learner(uuid) from public;
revoke execute on function public.link_learner_to_commander(uuid) from public;
revoke execute on function public.unlink_learner(uuid) from public;
revoke execute on function public.record_attempt(uuid, int[]) from public;
revoke execute on function public.list_commander_invites() from public;

grant execute on function public.is_commander() to authenticated;
grant execute on function public.is_my_learner(uuid) to authenticated;
grant execute on function public.link_learner_to_commander(uuid) to authenticated;
grant execute on function public.unlink_learner(uuid) to authenticated;
grant execute on function public.record_attempt(uuid, int[]) to authenticated;
grant execute on function public.list_commander_invites() to authenticated;
