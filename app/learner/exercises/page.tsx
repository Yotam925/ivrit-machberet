import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import {
  EXERCISE_MODE_LABELS_HE,
  EXERCISE_TYPE_LABELS_HE,
  type ExerciseRecord,
} from "@/lib/supabase/types";

function ExerciseRow({
  exercise,
  assigned,
  bestScore,
}: {
  exercise: ExerciseRecord;
  assigned: boolean;
  bestScore: number | null;
}) {
  return (
    <li>
      <Link
        href={`/learner/exercises/${exercise.id}`}
        className="block rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-400"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{exercise.title}</p>
          {assigned && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              משימה אישית מהמפקד/ת
            </span>
          )}
          {bestScore !== null && (
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              הוגש · {bestScore}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {EXERCISE_MODE_LABELS_HE[exercise.mode]} · {EXERCISE_TYPE_LABELS_HE[exercise.type]} ·{" "}
          {exercise.items.length} פריטים
        </p>
      </Link>
    </li>
  );
}

export default async function LearnerExercisesPage() {
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
    .select("commander_id")
    .eq("id", user.id)
    .single();

  // RLS on public.exercises already restricts rows to the caller's own
  // linked commander — no extra filter needed here.
  const [{ data: exerciseRows }, { data: assignmentRows }, { data: attemptRows }] =
    await Promise.all([
      supabase.from("exercises").select("*").order("created_at", { ascending: false }),
      supabase.from("exercise_assignments").select("exercise_id").eq("learner_id", user.id),
      supabase.from("exercise_attempts").select("exercise_id, score, total").eq("user_id", user.id),
    ]);

  const exercises = (exerciseRows ?? []) as ExerciseRecord[];
  const assignedIds = new Set(
    ((assignmentRows ?? []) as { exercise_id: string }[]).map((a) => a.exercise_id),
  );

  const bestByExercise = new Map<string, number>();
  for (const attempt of (attemptRows ?? []) as {
    exercise_id: string;
    score: number;
    total: number;
  }[]) {
    const pct = Math.round((attempt.score / attempt.total) * 100);
    const current = bestByExercise.get(attempt.exercise_id);
    if (current === undefined || pct > current) bestByExercise.set(attempt.exercise_id, pct);
  }

  const assigned = exercises.filter((e) => assignedIds.has(e.id));
  const rest = exercises.filter((e) => !assignedIds.has(e.id));

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold">תרגילים ומבחנים</h1>

      {!profile?.commander_id ? (
        <p className="text-gray-600">
          אינכם משויכים כרגע למפקד/ת, ולכן אין תרגילים להצגה. בקשו מהמפקד/ת שלכם לשייך אתכם
          מתוך מאגר החיילים באתר.
        </p>
      ) : exercises.length === 0 ? (
        <p className="text-gray-600">המפקד/ת שלך עדיין לא הוסיף/ה תרגילים.</p>
      ) : (
        <>
          {assigned.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-amber-700">
                נשלח אליך אישית
              </h2>
              <ul className="flex flex-col gap-3">
                {assigned.map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    assigned
                    bestScore={bestByExercise.get(exercise.id) ?? null}
                  />
                ))}
              </ul>
            </section>
          )}

          {rest.length > 0 && (
            <section className="flex flex-col gap-3">
              {assigned.length > 0 && (
                <h2 className="text-sm font-bold text-gray-500">
                  שאר התרגילים
                </h2>
              )}
              <ul className="flex flex-col gap-3">
                {rest.map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    assigned={false}
                    bestScore={bestByExercise.get(exercise.id) ?? null}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Link href="/learner/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
        חזרה לדף הבית
      </Link>
    </main>
  );
}
