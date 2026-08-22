import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * A learner submits their ANSWERS; the score is computed in the database by
 * record_attempt(), which reads the exercise's own correct answers. The client
 * never supplies a score — it cannot be trusted with one, since the whole
 * quiz (including correctIndex) is shipped to the browser to render it.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "לא מחובר/ת" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const { exercise_id: exerciseId, answers } = body as Record<string, unknown>;

  if (
    typeof exerciseId !== "string" ||
    !exerciseId ||
    !Array.isArray(answers) ||
    answers.length === 0 ||
    // -1 encodes "left blank"; the grader treats it as wrong
    !answers.every((a) => Number.isInteger(a) && (a as number) >= -1)
  ) {
    return NextResponse.json({ error: "שדות חסרים או לא תקינים" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("record_attempt", {
    p_exercise_id: exerciseId,
    p_answers: answers,
  });

  if (error) {
    return NextResponse.json({ error: "שמירת התוצאה נכשלה" }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  return NextResponse.json(
    { score: result?.score ?? null, total: result?.total ?? null },
    { status: 201 },
  );
}
