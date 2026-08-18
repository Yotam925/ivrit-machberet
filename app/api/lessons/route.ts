import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LessonCategory, UserLevel } from "@/lib/supabase/types";

const VALID_CATEGORIES: LessonCategory[] = ["hebrew", "army", "zionism"];
const VALID_LEVELS: UserLevel[] = ["beginner", "intermediate", "advanced"];

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "לא מחובר/ת" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const level = searchParams.get("level");

  let query = supabase.from("lessons").select("*").order("sort_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }
  if (level) {
    query = query.eq("level", level);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "שגיאה בשליפת שיעורים" }, { status: 500 });
  }

  return NextResponse.json({ lessons: data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "לא מחובר/ת" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "commander") {
    return NextResponse.json({ error: "רק מפקד/ת יכול/ה ליצור שיעורים" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const { title, category, level, content, sort_order } = body as Record<string, unknown>;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof category !== "string" ||
    !VALID_CATEGORIES.includes(category as LessonCategory) ||
    typeof level !== "string" ||
    !VALID_LEVELS.includes(level as UserLevel) ||
    typeof content !== "object" ||
    content === null
  ) {
    return NextResponse.json({ error: "שדות חסרים או לא תקינים" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      title,
      category,
      level,
      content,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "יצירת השיעור נכשלה" }, { status: 500 });
  }

  return NextResponse.json({ lesson: data }, { status: 201 });
}
