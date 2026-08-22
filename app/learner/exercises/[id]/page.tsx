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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <ExercisePlayer exercise={exercise as ExerciseRecord} />
      <Link href="/learner/exercises" className="text-sm font-medium text-blue-600 hover:underline">
        חזרה לרשימת התרגילים
      </Link>
    </main>
  );
}
