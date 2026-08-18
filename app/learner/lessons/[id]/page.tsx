import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { LessonPlayer } from "@/components/LessonPlayer";
import { isPlayableLessonContent, type Lesson } from "@/lib/supabase/types";

export default async function LessonPage({ params }: { params: { id: string } }) {
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

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!lesson) {
    notFound();
  }

  if (!isPlayableLessonContent(lesson.content)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        <p className="text-gray-600">התוכן של השיעור הזה עדיין לא מוכן.</p>
        <a href="/learner/lessons" className="font-medium text-blue-600 hover:underline">
          חזרה לרשימת השיעורים
        </a>
      </main>
    );
  }

  // Mark the lesson as started, but only if there's no progress row yet —
  // ignoreDuplicates means an existing row (in progress OR already
  // completed) is left untouched, so revisiting a finished lesson can't
  // accidentally reset it back to incomplete.
  await supabase
    .from("user_progress")
    .upsert(
      { user_id: user.id, lesson_id: lesson.id, completed: false },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
    );

  return <LessonPlayer lesson={lesson as Lesson} />;
}
