import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Assign / unassign one exercise to one soldier. Both directions are gated by
 * RLS (`assigned_by = auth.uid()` plus `is_my_learner(learner_id)` on insert),
 * so a commander can only ever push content to their own people.
 */

async function readBody(request: Request) {
  const body = await request.json().catch(() => null);
  const exerciseId = (body as Record<string, unknown> | null)?.exercise_id;
  const learnerId = (body as Record<string, unknown> | null)?.learner_id;

  if (typeof exerciseId !== "string" || !exerciseId) return null;
  if (typeof learnerId !== "string" || !learnerId) return null;

  return { exerciseId, learnerId };
}

async function requireCommander(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "לא מחובר/ת" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "commander") {
    return { error: NextResponse.json({ error: "פעולה למפקדים בלבד" }, { status: 403 }) };
  }

  return { user };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const auth = await requireCommander(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const parsed = await readBody(request);
  if (!parsed) {
    return NextResponse.json({ error: "שדות חסרים או לא תקינים" }, { status: 400 });
  }

  const { error } = await supabase.from("exercise_assignments").insert({
    exercise_id: parsed.exerciseId,
    learner_id: parsed.learnerId,
    assigned_by: user.id,
  });

  if (error) {
    // a duplicate assignment is a no-op, not a failure
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, alreadyAssigned: true });
    }
    return NextResponse.json({ error: "שליחת התרגיל נכשלה" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const auth = await requireCommander(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const parsed = await readBody(request);
  if (!parsed) {
    return NextResponse.json({ error: "שדות חסרים או לא תקינים" }, { status: 400 });
  }

  const { error } = await supabase
    .from("exercise_assignments")
    .delete()
    .eq("exercise_id", parsed.exerciseId)
    .eq("learner_id", parsed.learnerId)
    .eq("assigned_by", user.id);

  if (error) {
    return NextResponse.json({ error: "ביטול השליחה נכשל" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
