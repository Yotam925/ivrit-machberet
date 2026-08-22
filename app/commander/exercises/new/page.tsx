import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { ExerciseBuilderForm } from "@/components/ExerciseBuilderForm";

export default async function NewExercisePage() {
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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">צור תרגיל/מבחן</h1>
        <Link href="/commander/exercises" className="text-sm font-medium text-blue-600 hover:underline">
          ביטול
        </Link>
      </div>
      <ExerciseBuilderForm />
    </main>
  );
}
