-- Adds a fifth, fully-built lesson ("המשפחה שלי") using the new stage-based
-- content model consumed by LessonPlayer: video -> content -> practice ->
-- questions -> reflection. The four lessons from migration 0002 keep their
-- old {"sections": [...]} shape and are intentionally NOT migrated — the
-- lesson page shows a "content not ready" fallback for any lesson whose
-- content doesn't match the new {"stages": [...]} shape, so they remain
-- safely browsable without a crash.

insert into public.lessons (id, title, category, level, sort_order, content)
values (
  '55555555-5555-5555-5555-555555555555',
  'שיעור 5: המשפחה שלי',
  'hebrew',
  'beginner',
  5,
  '{
    "stages": [
      {
        "kind": "video",
        "title": "מבוא: המשפחה שלי",
        "videoUrl": null,
        "description": "בקרוב יתווסף כאן סרטון קצר שמציג מילות יסוד על בני משפחה."
      },
      {
        "kind": "content",
        "title": "אוצר מילים: המשפחה",
        "sections": [
          {"type": "text", "body": "בשיעור הזה נלמד איך לקרוא לבני המשפחה הקרובים בעברית."},
          {"type": "vocabulary", "items": [
            {"term": "אמא", "meaning": "mother"},
            {"term": "אבא", "meaning": "father"},
            {"term": "אח", "meaning": "brother"},
            {"term": "אחות", "meaning": "sister"},
            {"term": "סבא", "meaning": "grandfather"},
            {"term": "סבתא", "meaning": "grandmother"}
          ]}
        ]
      },
      {
        "kind": "practice",
        "title": "בואו נתרגל",
        "exercises": [
          {"type": "multiple_choice", "prompt": "איך אומרים mother בעברית?", "options": ["אבא", "אמא", "אחות", "סבתא"], "correctIndex": 1},
          {"type": "fill_blank", "sentenceBefore": "ה", "sentenceAfter": " של אבא שלי גר בחיפה.", "options": ["אבא", "אח", "סבא"], "correctIndex": 2},
          {"type": "matching", "pairs": [
            {"left": "אח", "right": "brother"},
            {"left": "אחות", "right": "sister"},
            {"left": "סבא", "right": "grandfather"},
            {"left": "סבתא", "right": "grandmother"}
          ]}
        ]
      },
      {
        "kind": "questions",
        "title": "מבחן קצר",
        "exercises": [
          {"type": "multiple_choice", "prompt": "איך אומרים father בעברית?", "options": ["אמא", "אבא", "אח", "סבא"], "correctIndex": 1},
          {"type": "multiple_choice", "prompt": "איך אומרים sister בעברית?", "options": ["אח", "אחות", "סבתא", "אמא"], "correctIndex": 1},
          {"type": "fill_blank", "sentenceBefore": "ה", "sentenceAfter": " שלי אופה עוגות מדהימות.", "options": ["אח", "סבתא", "אבא"], "correctIndex": 1}
        ]
      },
      {
        "kind": "reflection",
        "title": "משימת חשיבה",
        "prompt": "ספר/י בקצרה על בן משפחה אחד שחשוב לך, ולמה."
      }
    ]
  }'::jsonb
)
on conflict (id) do nothing;
