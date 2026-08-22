import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import type { ExerciseRecord } from "@/lib/supabase/types";
import { DeleteExerciseButton } from "@/components/DeleteExerciseButton";

const TYPE_LABELS_HE: Record<ExerciseRecord["type"], string> = {
  flashcards: "כרטיסיות",
  quiz: "מבחן אמריקאי",
};

export default async function CommanderExercisesPage() {
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

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">התרגילים שיצרתי</h1>
        <Link
          href="/commander/exercises/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + צור תרגיל/מבחן
        </Link>
      </div>

      {!exercises || exercises.length === 0 ? (
        <p className="text-gray-600">עדיין לא יצרת תרגילים.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {(exercises as ExerciseRecord[]).map((exercise) => (
            <li
              key={exercise.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="font-medium">{exercise.title}</p>
                <p className="text-sm text-gray-500">
                  {TYPE_LABELS_HE[exercise.type]} · {exercise.items.length} פריטים
                </p>
              </div>
              <DeleteExerciseButton exerciseId={exercise.id} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/commander/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
        חזרה לדף הבית
      </Link>
    </main>
  );
}
