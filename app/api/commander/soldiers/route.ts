import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireCommander() {
  const supabase = createClient();
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

  return { supabase, user };
}

/** Link a soldier to the calling commander. */
export async function POST(request: Request) {
  const auth = await requireCommander();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const learnerId = (body as Record<string, unknown> | null)?.learner_id;

  if (typeof learnerId !== "string" || !learnerId) {
    return NextResponse.json({ error: "חסר מזהה חייל" }, { status: 400 });
  }

  // commander_id is trigger-protected; the RPC is the only sanctioned path.
  const { error } = await supabase.rpc("link_learner_to_commander", { learner: learnerId });

  if (error) {
    return NextResponse.json({ error: "שיוך החייל נכשל" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Remove a soldier from the calling commander's space. */
export async function DELETE(request: Request) {
  const auth = await requireCommander();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const learnerId = (body as Record<string, unknown> | null)?.learner_id;

  if (typeof learnerId !== "string" || !learnerId) {
    return NextResponse.json({ error: "חסר מזהה חייל" }, { status: 400 });
  }

  const { error } = await supabase.rpc("unlink_learner", { learner: learnerId });

  if (error) {
    return NextResponse.json({ error: "ביטול השיוך נכשל" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
