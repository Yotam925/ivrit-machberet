import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { LEVEL_LABELS_HE, isPlayableLessonContent, type UserLevel } from "@/lib/supabase/types";

type Status = "not_started" | "in_progress" | "completed";

const STATUS_LABELS: Record<Status, string> = {
  not_started: "לא התחיל",
  in_progress: "בתהליך",
  completed: "הושלם",
};

const STATUS_STYLES: Record<Status, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  hebrew: "עברית",
  army: 'צה"ל',
  zionism: "ציונות",
};

export default async function MyLessonsPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single();

  if (!profile?.level) {
    redirect("/learner/level-test");
  }

  const level = profile.level as UserLevel;

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, category, level, sort_order, content")
      .eq("level", level)
      .order("sort_order", { ascending: true }),
    supabase.from("user_progress").select("lesson_id, completed, score").eq("user_id", user.id),
  ]);

  const progressByLesson = new Map((progress ?? []).map((p) => [p.lesson_id, p]));

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">השיעורים שלי</h1>
        <p className="text-gray-600">רמה: {LEVEL_LABELS_HE[level]}</p>
      </div>

      {!lessons || lessons.length === 0 ? (
        <p className="text-gray-600">אין עדיין שיעורים ברמה שלך.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lessons.map((lesson) => {
            const ready = isPlayableLessonContent(lesson.content);

            if (!ready) {
              return (
                <li
                  key={lesson.id}
                  className="flex cursor-not-allowed items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 opacity-60"
                >
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-gray-500">
                      {CATEGORY_LABELS[lesson.category] ?? lesson.category}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-500">
                    בקרוב
                  </span>
                </li>
              );
            }

            const p = progressByLesson.get(lesson.id);
            const status: Status = p?.completed ? "completed" : p ? "in_progress" : "not_started";
            return (
              <li key={lesson.id}>
                <Link
                  href={`/learner/lessons/${lesson.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition hover:border-blue-300"
                >
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-gray-500">
                      {CATEGORY_LABELS[lesson.category] ?? lesson.category}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[status]}`}>
                    {STATUS_LABELS[status]}
                    {status === "completed" && p?.score !== null && p?.score !== undefined
                      ? ` (${p.score}%)`
                      : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/learner/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
        חזרה לדשבורד
      </Link>
    </main>
  );
}
