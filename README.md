# עברית מחברת

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
  - `app/commander/dashboard` — אזור המפקד/מדריך, מוגן על ידי middleware (`/commander/dashboard`)
  - `app/api/lessons` — API לשליפה/יצירה של שיעורים
- `middleware.ts` — מפנה משתמשים לא מחוברים ל-`/login`, ומוודא שכל תפקיד רואה רק
  את האזור שלו
- `lib/` — קוד משותף: חיבור ל-Supabase (`lib/supabase/`), מבחן הרמה (`lib/placement-test.ts`)
- `components/` — רכיבי UI משותפים
- `supabase/migrations/` — סכמת מסד הנתונים (SQL) שמריצים ידנית ב-Supabase

## מודל תוכן לימודי

- `profiles.level` — הרמה שנקבעה למשתמש (`beginner`/`intermediate`/`advanced`), נשמרת
  אוטומטית בסיום מבחן הרמה. חניך שעוד לא עשה את המבחן מופנה אליו אוטומטית
  מה-dashboard.
- `lessons` — שיעורים: `id`, `title`, `category` (`hebrew`/`army`/`zionism`), `level`,
  `sort_order`, `content` (jsonb — ראו מבנה למטה). כרגע מכיל 4 שיעורי דמה.
- `user_progress` — טבלה שמוכנה לשלב הבא (עדיין אין מסך שכותב אליה): מי השלים
  איזה שיעור, עם איזה ציון.
- `GET /api/lessons` — רשימת שיעורים, אפשר לסנן עם `?category=` ו/או `?level=`.
  דורש התחברות.
- `POST /api/lessons` — יצירת שיעור חדש. דורש התחברות **וגם** תפקיד מפקד/מדריך
  (נבדק גם בקוד וגם ב-RLS של מסד הנתונים).

### מבנה ה-content (jsonb)

כל שיעור הוא רשימה של "sections" מסוגים שונים, כדי שאפשר יהיה להוסיף סוגי
תוכן חדשים בעתיד בלי migration חדשה:

```json
{
  "sections": [
    { "type": "text", "body": "טקסט הסבר רגיל" },
    {
      "type": "vocabulary",
      "items": [{ "term": "שלום", "meaning": "hello" }]
    },
    {
      "type": "quiz",
      "questions": [
        { "prompt": "...", "options": ["...", "..."], "correctIndex": 0 }
      ]
    }
  ]
}
```

## סקריפטים

- `npm run dev` — שרת פיתוח
- `npm run build` — בנייה לפרודקשן
- `npm run start` — הרצת בנייה קיימת
- `npm run lint` — בדיקת ESLint
- `npm run format` — עיצוב קוד עם Prettier

## סטטוס

הרשמה/התחברות עם תפקידים (חניך/מפקד), מבחן רמה, ומודל תוכן לימודי בסיסי (4
שיעורי דמה) מוכנים. עדיין אין תוכן לימודי אמיתי ואין מסך לצפייה/השלמת שיעור —
זה השלב הבא.
