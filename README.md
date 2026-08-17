# עברית מחברת

פלטפורמה ללימוד עברית, הכנה לצה"ל, והיכרות עם החברה הישראלית וציונות — לבני
מיעוטים, עולים חדשים ומועמדים לשירות.

## טכנולוגיות

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS, עם תמיכת RTL מלאה כברירת מחדל (`dir="rtl"`, `lang="he"` ב-`app/layout.tsx`)
- Supabase — אימות משתמשים (Auth) ומסד נתונים (Postgres)

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
3. בפרויקט: SQL Editor → New query — מדביקים את כל התוכן של
   `supabase/migrations/0001_profiles.sql` ולוחצים Run. זה יוצר את טבלת
   `profiles` ואת הטריגר שיוצר שורת פרופיל אוטומטית בכל הרשמה.
4. ברירת המחדל של Supabase דורשת אישור אימייל לפני התחברות ראשונה. אם רוצים
   שמשתמש חדש יתחבר מיד אחרי ההרשמה (נוח לבדיקות), אפשר לכבות את זה תחת
   Authentication → Providers → Email → "Confirm email". האפליקציה תומכת
   בשני המצבים בכל מקרה.
5. מריצים `npm run dev` ונכנסים ל-`/login`.

## מבנה תיקיות

- `app/` — נתיבי Next.js (App Router)
  - `app/(auth)/login` — טופס התחברות/הרשמה (`/login`)
  - `app/learner/dashboard` — אזור הלומד, מוגן על ידי middleware (`/learner/dashboard`)
  - `app/commander/dashboard` — אזור המפקד/מדריך, מוגן על ידי middleware (`/commander/dashboard`)
- `middleware.ts` — מפנה משתמשים לא מחוברים ל-`/login`, ומוודא שכל תפקיד רואה רק
  את האזור שלו
- `lib/` — קוד משותף, כולל חיבור ל-Supabase (`lib/supabase/`)
- `components/` — רכיבי UI משותפים
- `supabase/migrations/` — סכמת מסד הנתונים (SQL) שמריצים ידנית ב-Supabase

## סקריפטים

- `npm run dev` — שרת פיתוח
- `npm run build` — בנייה לפרודקשן
- `npm run start` — הרצת בנייה קיימת
- `npm run lint` — בדיקת ESLint
- `npm run format` — עיצוב קוד עם Prettier

## סטטוס

הרשמה/התחברות עם תפקידים (חניך/מפקד) מוכנה. עדיין אין תוכן לימודי — זה השלב הבא.
