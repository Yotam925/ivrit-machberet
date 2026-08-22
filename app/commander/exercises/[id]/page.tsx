import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import type { ExerciseRecord } from "@/lib/supabase/types";
import { PreviewPlayer } from "@/components/exercises/PreviewPlayer";

export default async function CommanderExercisePreviewPage({
  params,
}: {
  params: { id: string };
}) {
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

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", params.id)
    .single();

  // RLS already limits a commander to their own rows; check explicitly too so
  // a policy change can never turn this into a window onto someone else's work.
  if (!exercise || exercise.created_by !== user.id) {
    notFound();
  }

  return (
    <main className="almanac">
      <PreviewPlayer exercise={exercise as ExerciseRecord} />
      <div className="alm-actions">
        <Link href="/commander/exercises" className="alm-secondary">
          חזרה לרשימת התרגילים
        </Link>
      </div>
    </main>
  );
}
