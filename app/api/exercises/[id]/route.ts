import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "לא מחובר/ת" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "התרגיל לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({ exercise: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "לא מחובר/ת" }, { status: 401 });
  }

  const { error } = await supabase.from("exercises").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "מחיקת התרגיל נכשלה" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
