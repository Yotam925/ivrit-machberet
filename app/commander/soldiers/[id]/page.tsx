import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import {
  EXERCISE_MODE_LABELS_HE,
  EXERCISE_TYPE_LABELS_HE,
  LEVEL_LABELS_HE,
  type ExerciseAssignment,
  type ExerciseAttempt,
  type ExerciseRecord,
  type SoldierSummary,
  type UserLevel,
} from "@/lib/supabase/types";
import { ProgressChart } from "@/components/commander/ProgressChart";
import { AssignExerciseList } from "@/components/commander/AssignExerciseList";
import { LinkSoldierButton } from "@/components/commander/LinkSoldierButton";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default async function SoldierDetailPage({ params }: { params: { id: string } }) {
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

  const { data: soldierRow } = await supabase
    .from("profiles")
    .select("id, full_name, native_language, level, commander_id, created_at")
    .eq("id", params.id)
    .single();

  // Only this commander's own soldiers have a detail page. RLS lets a commander
  // read any learner row (for the directory), so the ownership check here is
  // what actually gates the grades and the assignment controls.
  if (!soldierRow || soldierRow.commander_id !== user.id) {
    notFound();
  }

  const soldier = soldierRow as SoldierSummary;

  const [
    { data: attemptRows, error: attemptsError },
    { data: exerciseRows },
    { data: assignmentRows },
    { data: progressRows },
  ] = await Promise.all([
      supabase
        .from("exercise_attempts")
        .select(
          "id, exercise_id, user_id, score, total, exercise_title, exercise_mode, created_at",
        )
        .eq("user_id", soldier.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("exercises")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("exercise_assignments")
        .select("id, exercise_id, learner_id, assigned_by, created_at")
        .eq("learner_id", soldier.id)
        .eq("assigned_by", user.id),
      supabase
        .from("user_progress")
        .select("id, user_id, lesson_id, completed, score, completed_at")
        .eq("user_id", soldier.id),
    ]);

  const attempts = (attemptRows ?? []) as ExerciseAttempt[];
  const myExercises = (exerciseRows ?? []) as ExerciseRecord[];
  const assignments = (assignmentRows ?? []) as ExerciseAssignment[];
  const lessonProgress = (progressRows ?? []) as {
    lesson_id: string;
    completed: boolean;
    score: number | null;
  }[];

  const titleOf = (attempt: ExerciseAttempt) =>
    attempt.exercise_title ??
    (attempt.exercise_id ? (myExercises.find((e) => e.id === attempt.exercise_id)?.title ?? "תרגיל") : "תרגיל שנמחק");

  const percentages = attempts.map((a) => Math.round((a.score / a.total) * 100));
  const average = percentages.length
    ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
    : null;
  const best = percentages.length ? Math.max(...percentages) : null;
  const completedLessons = lessonProgress.filter((p) => p.completed).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-10">
      <div>
        <Link
          href="/commander/soldiers"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          חזרה לחיילים שלי
        </Link>
        <h1 className="mt-3 text-2xl font-bold">{soldier.full_name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {soldier.native_language ? `שפת אם: ${soldier.native_language} · ` : ""}
          הצטרף/ה ב־
          {new Date(soldier.created_at).toLocaleDateString("he-IL")}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="רמת עברית"
          value={soldier.level ? LEVEL_LABELS_HE[soldier.level as UserLevel] : "—"}
          hint={soldier.level ? "לפי מבחן הרמה" : "טרם עבר/ה מבחן רמה"}
        />
        <StatCard label="הגשות" value={String(attempts.length)} hint="מבחנים שהוגשו" />
        <StatCard label="ממוצע" value={average !== null ? `${average}%` : "—"} />
        <StatCard
          label="שיעורים"
          value={String(completedLessons)}
          hint={`מתוך ${lessonProgress.length} שהתחיל/ה`}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">גרף שיפור</h2>
        {attemptsError ? (
          <p className="text-sm text-red-600">טעינת הציונים נכשלה. רעננו את הדף ונסו שוב.</p>
        ) : (
          <ProgressChart attempts={attempts} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">היסטוריית הגשות</h2>
        {attemptsError ? (
          <p className="text-sm text-red-600">טעינת ההגשות נכשלה. רעננו את הדף ונסו שוב.</p>
        ) : attempts.length === 0 ? (
          <p className="text-sm text-gray-500">החייל/ת עדיין לא הגיש/ה אף מבחן.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {[...attempts].reverse().map((attempt) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              return (
                <li
                  key={attempt.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{titleOf(attempt)}</p>
                    <p className="text-xs text-gray-500">
                      {attempt.exercise_mode
                        ? `${EXERCISE_MODE_LABELS_HE[attempt.exercise_mode]} · `
                        : ""}
                      {new Date(attempt.created_at).toLocaleString("he-IL")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      pct >= 80
                        ? "bg-green-50 text-green-700"
                        : pct >= 50
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {attempt.score}/{attempt.total} · {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {best !== null && (
          <p className="text-xs text-gray-500">התוצאה הגבוהה ביותר עד כה: {best}%</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">שליחת תוכן אישי</h2>
          <p className="mt-1 text-sm text-gray-600">
            תרגילים, מבחנים וקטעי קריאה שתשלחו יופיעו לחייל בראש רשימת התרגילים שלו, מסומנים
            כמשימה אישית.
          </p>
        </div>
        <AssignExerciseList
          learnerId={soldier.id}
          exercises={myExercises}
          assignedIds={assignments.map((a) => a.exercise_id)}
        />
      </section>

      {assignments.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">נשלח לחייל ({assignments.length})</h2>
          <ul className="flex flex-col gap-2">
            {assignments.map((assignment) => {
              const exercise = myExercises.find((e) => e.id === assignment.exercise_id);
              const done = attempts.filter((a) => a.exercise_id === assignment.exercise_id);
              const bestOnThis = done.length
                ? Math.max(...done.map((a) => Math.round((a.score / a.total) * 100)))
                : null;
              return (
                <li
                  key={assignment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{exercise?.title ?? "תרגיל שנמחק"}</p>
                    {exercise && (
                      <p className="text-xs text-gray-500">
                        {EXERCISE_MODE_LABELS_HE[exercise.mode]} ·{" "}
                        {EXERCISE_TYPE_LABELS_HE[exercise.type]}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {exercise && exercise.type !== "quiz"
                      ? "תוכן לתרגול — ללא ציון"
                      : bestOnThis !== null
                        ? `הוגש · ${bestOnThis}%`
                        : "טרם הוגש"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 px-5 py-4">
        <h2 className="text-base font-bold">ניהול השיוך</h2>
        <p className="text-sm text-gray-600">
          הסרה מהמרחב שלכם תסיר מ{soldier.full_name} את הגישה לתרגילים ולמשימות ששלחתם. הציונים
          וההיסטוריה יישמרו, ואפשר לשייך מחדש בכל רגע — כל עוד מפקד/ת אחר/ת לא שייך/ה אותם קודם.
        </p>
        <div className="self-start">
          <LinkSoldierButton
            learnerId={soldier.id}
            soldierName={soldier.full_name}
            state="mine"
            afterUnlink="/commander/soldiers"
          />
        </div>
      </section>
    </main>
  );
}
