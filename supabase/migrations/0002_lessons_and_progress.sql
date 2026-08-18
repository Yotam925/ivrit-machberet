-- Adds a learner level field, a lessons content model, and per-user lesson progress.

alter table public.profiles
  add column if not exists level text check (level in ('beginner', 'intermediate', 'advanced'));

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('hebrew', 'army', 'zionism')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  sort_order int not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "lessons_select_authenticated"
  on public.lessons for select
  using (auth.uid() is not null);

-- Only commanders/instructors can add lesson content — checked here at the DB
-- layer (defense in depth) in addition to the API route's own role check.
create policy "lessons_insert_commander"
  on public.lessons for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'commander'
    )
  );

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed boolean not null default false,
  score int,
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

alter table public.user_progress enable row level security;

create policy "user_progress_select_own"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "user_progress_insert_own"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "user_progress_update_own"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed data: 4 placeholder lessons so the app has something to display before
-- real content exists. Fixed ids make this migration safe to re-run.
insert into public.lessons (id, title, category, level, sort_order, content)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'שיעור 1: ברכות בסיסיות',
    'hebrew',
    'beginner',
    1,
    '{
      "sections": [
        {"type": "text", "body": "בשיעור הזה נלמד איך לברך אנשים בעברית בסיטואציות יומיומיות."},
        {"type": "vocabulary", "items": [
          {"term": "שלום", "meaning": "hello / goodbye / peace"},
          {"term": "בוקר טוב", "meaning": "good morning"},
          {"term": "תודה", "meaning": "thank you"},
          {"term": "בבקשה", "meaning": "please / you are welcome"}
        ]},
        {"type": "quiz", "questions": [
          {"prompt": "איך אומרים good morning בעברית?", "options": ["שלום", "בוקר טוב", "תודה", "בבקשה"], "correctIndex": 1}
        ]}
      ]
    }'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'שיעור 2: מבנה בסיסי של צה״ל',
    'army',
    'beginner',
    2,
    '{
      "sections": [
        {"type": "text", "body": "מבוא קצר למבנה ההיררכי הבסיסי בצה״ל, כהכנה למי שעומד או עומדת להתגייס."},
        {"type": "vocabulary", "items": [
          {"term": "טירונות", "meaning": "basic training"},
          {"term": "פלוגה", "meaning": "company (military unit)"},
          {"term": "מפקד", "meaning": "commander"}
        ]},
        {"type": "quiz", "questions": [
          {"prompt": "מה זו טירונות?", "options": ["חופשה", "אימון בסיסי", "דרגה", "בסיס"], "correctIndex": 1}
        ]}
      ]
    }'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'שיעור 3: יסודות הציונות',
    'zionism',
    'beginner',
    3,
    '{
      "sections": [
        {"type": "text", "body": "היכרות ראשונית עם רעיון הציונות ומקומה בהקמת מדינת ישראל."},
        {"type": "vocabulary", "items": [
          {"term": "ציונות", "meaning": "Zionism"},
          {"term": "עלייה", "meaning": "immigration to Israel"}
        ]},
        {"type": "quiz", "questions": [
          {"prompt": "המילה עלייה מתייחסת בהקשר הזה ל...", "options": ["טיול קצר", "הגירה לישראל", "לימודים", "עבודה"], "correctIndex": 1}
        ]}
      ]
    }'::jsonb
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'שיעור 4: זמן עבר בעברית',
    'hebrew',
    'intermediate',
    4,
    '{
      "sections": [
        {"type": "text", "body": "בשיעור הזה נתרגל נטיית פעלים בזמן עבר בעברית."},
        {"type": "vocabulary", "items": [
          {"term": "הלכתי", "meaning": "I went"},
          {"term": "אכלתי", "meaning": "I ate"}
        ]},
        {"type": "quiz", "questions": [
          {"prompt": "השלם: אתמול ___ לבית הספר.", "options": ["הולך", "הלכתי", "אלך", "ללכת"], "correctIndex": 1}
        ]}
      ]
    }'::jsonb
  )
on conflict (id) do nothing;
