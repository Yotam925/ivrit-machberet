import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import type { ExerciseRecord } from "@/lib/supabase/types";
import { ExercisePlayer } from "@/components/ExercisePlayer";

export default async function ExercisePlayerPage({ params }: { params: { id: string } }) {
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

  if (!exercise) {
    notFound();
  }

  return (
    <main className="almanac">
      <ExercisePlayer exercise={exercise as ExerciseRecord} />
      <div className="alm-actions">
        <Link href="/learner/exercises" className="alm-secondary">
          חזרה לרשימת התרגילים
        </Link>
      </div>
    </main>
  );
}
