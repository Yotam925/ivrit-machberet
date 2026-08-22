-- Commander-authored exercises: flashcard decks and multiple-choice tests.

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('flashcards', 'quiz')),
  created_by uuid not null references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises_select_authenticated"
  on public.exercises for select
  using (auth.uid() is not null);

-- Only commanders can author exercises — checked here (defense in depth)
-- in addition to the API route's own role check, matching the pattern
-- used for public.lessons in migration 0002.
create policy "exercises_insert_commander"
  on public.exercises for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'commander'
    )
  );

create policy "exercises_delete_own"
  on public.exercises for delete
  using (auth.uid() = created_by);
