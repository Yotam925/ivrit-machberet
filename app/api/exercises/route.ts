import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseMode, ExerciseType, FlashcardItem, QuizItem } from "@/lib/supabase/types";

const VALID_TYPES: ExerciseType[] = ["flashcards", "quiz"];
const VALID_MODES: ExerciseMode[] = ["exercise", "test"];

function validateItems(type: ExerciseType, items: unknown): items is FlashcardItem[] | QuizItem[] {
  if (!Array.isArray(items) || items.length === 0) return false;

  if (type === "flashcards") {
    return items.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as FlashcardItem).term === "string" &&
        (item as FlashcardItem).term.trim() &&
        typeof (item as FlashcardItem).definition === "string" &&
        (item as FlashcardItem).definition.trim(),
    );
  }

  return items.every((item) => {
    const q = item as QuizItem;
    return (
      item &&
      typeof item === "object" &&
      typeof q.question === "string" &&
      q.question.trim() &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.options.every((o) => typeof o === "string" && o.trim()) &&
      Number.isInteger(q.correctIndex) &&
      q.correctIndex >= 0 &&
      q.correctIndex < q.options.length
    );
  });
}

export async function GET() {
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
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "שגיאה בשליפת תרגילים" }, { status: 500 });
  }

  return NextResponse.json({ exercises: data });
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
    return NextResponse.json({ error: "רק מפקד/ת יכול/ה ליצור תרגילים" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const { title, type, mode, items } = body as Record<string, unknown>;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof type !== "string" ||
    !VALID_TYPES.includes(type as ExerciseType) ||
    typeof mode !== "string" ||
    !VALID_MODES.includes(mode as ExerciseMode) ||
    !validateItems(type as ExerciseType, items)
  ) {
    return NextResponse.json({ error: "שדות חסרים או לא תקינים" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      title,
      type,
      mode,
      created_by: user.id,
      items,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "יצירת התרגיל נכשלה" }, { status: 500 });
  }

  return NextResponse.json({ exercise: data }, { status: 201 });
}
