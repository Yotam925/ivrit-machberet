"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeLessonAction(lessonId: string, scorePercent: number | null) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "לא מחובר/ת" };
  }

  // Upsert rather than update: a "started" row should already exist (written
  // when the lesson page first loaded), but upserting means completion is
  // still saved correctly even if that row is somehow missing, instead of a
  // plain UPDATE silently matching zero rows and losing the result.
  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      score: scorePercent,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    return { error: "שמירת ההתקדמות נכשלה" };
  }

  return { error: null };
}
