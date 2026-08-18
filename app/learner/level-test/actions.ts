"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLACEMENT_QUESTIONS, scoreToLevel } from "@/lib/placement-test";

export async function submitPlacementTest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
    return;
  }

  let correct = 0;
  for (const question of PLACEMENT_QUESTIONS) {
    const answer = formData.get(`q_${question.id}`);
    if (answer !== null && Number(answer) === question.correctIndex) {
      correct++;
    }
  }

  const level = scoreToLevel(correct, PLACEMENT_QUESTIONS.length);

  const { error } = await supabase.from("profiles").update({ level }).eq("id", user.id);

  if (error) {
    redirect(`/learner/level-test?error=${encodeURIComponent("שמירת התוצאה נכשלה, נסה/י שוב")}`);
    return;
  }

  redirect("/learner/dashboard");
}
