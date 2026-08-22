import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { EXERCISE_MODE_LABELS_HE, type ExerciseRecord } from "@/lib/supabase/types";

const TYPE_LABELS_HE: Record<ExerciseRecord["type"], string> = {
  flashcards: "כרטיסיות",
  quiz: "מבחן אמריקאי",
};

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
  // linked commander (or the caller's own, for a commander) — no extra
  // filter needed here.
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold">תרגילים ומבחנים</h1>

      {!profile?.commander_id ? (
        <p className="text-gray-600">
          עדיין לא משויך/ת למפקד/ת אישי/ת, ולכן אין תרגילים להצגה. פני/ה למפקד/ת שלך כדי לוודא
          שהם רשומים במערכת.
        </p>
      ) : !exercises || exercises.length === 0 ? (
        <p className="text-gray-600">המפקד/ת שלך עדיין לא הוסיף/ה תרגילים.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(exercises as ExerciseRecord[]).map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/learner/exercises/${exercise.id}`}
                className="block rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-400"
              >
                <p className="font-medium">{exercise.title}</p>
                <p className="text-sm text-gray-500">
                  {EXERCISE_MODE_LABELS_HE[exercise.mode]} · {TYPE_LABELS_HE[exercise.type]} ·{" "}
                  {exercise.items.length} פריטים
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/learner/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
        חזרה לדף הבית
      </Link>
    </main>
  );
}
