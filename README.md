# לומדים עברית

פלטפורמה ללימוד עברית, הכנה לצה"ל, והיכרות עם החברה הישראלית וציונות — לבני
מיעוטים, עולים חדשים ומועמדים לשירות.

## טכנולוגיות

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS, עם תמיכת RTL מלאה כברירת מחדל (`dir="rtl"`, `lang="he"` ב-`app/layout.tsx`)
- Supabase — אימות משתמשים (Auth), מסד נתונים (Postgres), ומודל תוכן לימודי

## הרצה מקומית

1. התקנת תלויות:

   ```bash
   npm install
   ```

2. יצירת קובץ סביבה מקומי מתוך הדוגמה:

   ```bash
   cp .env.local.example .env.local
   ```

3. הרצת שרת הפיתוח:

   ```bash
   npm run dev
   ```

4. פתיחת http://localhost:3000 בדפדפן

## הגדרת Supabase (חובה כדי שההתחברות/הרשמה תעבוד)

1. יוצרים פרויקט חדש וחינמי ב-https://supabase.com.
2. בפרויקט: Project Settings → API — מעתיקים את "Project URL" ואת מפתח ה-"anon public",
   ומדביקים אותם ב-`.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. בפרויקט: SQL Editor → New query — מדביקים את כל התוכן של כל קובץ
   בתיקיית `supabase/migrations/` (לפי סדר המספרים) ולוחצים Run.
4. ברירת המחדל של Supabase דורשת אישור אימייל לפני התחברות ראשונה. אם רוצים
   שמשתמש חדש יתחבר מיד אחרי ההרשמה (נוח לבדיקות), אפשר לכבות את זה תחת
   Authentication → Providers → Email → "Confirm email".
5. מריצים `npm run dev` ונכנסים ל-`/login`.

## מבנה תיקיות

- `app/` — נתיבי Next.js (App Router)
  - `app/(auth)/login` — טופס התחברות/הרשמה (`/login`)
  - `app/learner/dashboard` — אזור הלומד, מוגן על ידי middleware (`/learner/dashboard`)
  - `app/learner/level-test` — מבחן רמה לחניך חדש (`/learner/level-test`)
  - `app/learner/lessons` — "השיעורים שלי", רשימת שיעורים לפי רמה עם סטטוס (`/learner/lessons`)
  - `app/learner/lessons/[id]` — עמוד היחידה בפועל, מריץ את `LessonPlayer`
  - `app/commander/dashboard` — אזור המפקד/מדריך, מוגן על ידי middleware (`/commander/dashboard`)
  - `app/api/lessons` — API לשליפה/יצירה של שיעורים
- `middleware.ts` — מפנה משתמשים לא מחוברים ל-`/login`, ומוודא שכל תפקיד רואה רק
  את האזור שלו
- `lib/` — קוד משותף: חיבור ל-Supabase (`lib/supabase/`), מבחן הרמה (`lib/placement-test.ts`)
- `components/` — רכיבי UI משותפים, כולל `LessonPlayer.tsx` ומנוע התרגול
  (`components/lesson-stages/`, `components/exercises/`)
- `supabase/migrations/` — סכמת מסד הנתונים (SQL), מוחלת עם `npx supabase db push`
  (או ידנית ב-SQL Editor)

## מודל תוכן לימודי

- `profiles.level` — הרמה שנקבעה למשתמש (`beginner`/`intermediate`/`advanced`), נשמרת
  אוטומטית בסיום מבחן הרמה. חניך שעוד לא עשה את המבחן מופנה אליו אוטומטית
  מה-dashboard.
- `lessons` — שיעורים: `id`, `title`, `category` (`hebrew`/`army`/`zionism`), `level`,
  `sort_order`, `content` (jsonb — ראו מבנה למטה).
- `user_progress` — מי השלים איזה שיעור, עם איזה ציון (`completed`, `score`, `completed_at`).
  נכתבת אוטומטית: שורה נוצרת (completed=false) כשנכנסים ליחידה, ומתעדכנת
  (completed=true + ציון) כשמסיימים אותה.
- `GET /api/lessons` — רשימת שיעורים, אפשר לסנן עם `?category=` ו/או `?level=`.
  דורש התחברות.
- `POST /api/lessons` — יצירת שיעור חדש. דורש התחברות **וגם** תפקיד מפקד/מדריך
  (נבדק גם בקוד וגם ב-RLS של מסד הנתונים).

### מנוע היחידה (LessonPlayer)

כל יחידה בנויה מרצף שלבים קבוע (per הפק"א): **וידאו → תוכן → תרגול → שאלות →
משימת חשיבה**. ה-`content` (jsonb) של שיעור "מלא" נראה כך:

```json
{
  "stages": [
    { "kind": "video", "title": "...", "videoUrl": null, "description": "..." },
    { "kind": "content", "title": "...", "sections": [
      { "type": "text", "body": "..." },
      { "type": "vocabulary", "items": [{ "term": "שלום", "meaning": "hello" }] }
    ]},
    { "kind": "practice", "title": "...", "exercises": [ /* ראו סוגי תרגילים למטה */ ] },
    { "kind": "questions", "title": "...", "exercises": [ /* אותם סוגי תרגילים */ ] },
    { "kind": "reflection", "title": "...", "prompt": "שאלת חשיבה פתוחה" }
  ]
}
```

- `video` — אם `videoUrl` הוא `null`, מוצג placeholder ("וידאו יתווסף בהמשך").
  אין עדיין קול/AI — זה שלב מבני בלבד.
- `practice`/`questions` — אותו מנגנון תרגילים בדיוק; ההבדל היחיד: רק תוצאת
  ה-`questions` נכנסת לציון הסופי שנשמר ב-`user_progress`. `practice` הוא
  לתרגול בלבד.
- `reflection` — טקסט חופשי, לא נשמר ולא מצוין (אין AI לבדוק אותו כרגע — זה
  שלב מחשבה בלבד).

שלושה סוגי תרגילים נתמכים בתוך `exercises`:

```json
{ "type": "multiple_choice", "prompt": "...", "options": ["...", "..."], "correctIndex": 0 }
{ "type": "fill_blank", "sentenceBefore": "ה", "sentenceAfter": " שלי גר בחיפה.", "options": ["...", "..."], "correctIndex": 0 }
{ "type": "matching", "pairs": [{ "left": "אח", "right": "brother" }] }
```

שיעורים ישנים (מ-migration 0002) עדיין בפורמט הישן (`sections` בלי `stages`) —
עמוד היחידה מזהה את זה ומציג הודעת "התוכן עדיין לא מוכן" במקום לקרוס. שיעור
דמה מלא בפורמט החדש: "שיעור 5: המשפחה שלי" (migration 0003).

## סקריפטים

- `npm run dev` — שרת פיתוח
- `npm run build` — בנייה לפרודקשן
- `npm run start` — הרצת בנייה קיימת
- `npm run lint` — בדיקת ESLint
- `npm run format` — עיצוב קוד עם Prettier

## סטטוס

הרשמה/התחברות עם תפקידים (חניך/מפקד), מבחן רמה, ומנוע יחידת לימוד מלא (וידאו →
תוכן → תרגול → שאלות → משימת חשיבה, עם multiple choice / השלמת משפט / גרירה-והתאמה)
מוכנים ונבדקו מקצה לקצה. שיעור דמה מלא אחד ("המשפחה שלי") ועוד 4 שיעורים
בפורמט ישן/חלקי. עדיין אין: קול/AI, תוכן לימודי אמיתי, ניהול שיעורים ממסך
(רק דרך ה-API/SQL).
