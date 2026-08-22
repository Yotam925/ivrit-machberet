"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EXERCISE_MODE_LABELS_HE,
  EXERCISE_TYPE_LABELS_HE,
  type ExerciseRecord,
} from "@/lib/supabase/types";

export function AssignExerciseList({
  learnerId,
  exercises,
  assignedIds,
}: {
  learnerId: string;
  exercises: ExerciseRecord[];
  assignedIds: string[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const assigned = new Set(assignedIds);

  async function toggle(exerciseId: string, isAssigned: boolean) {
    setPendingId(exerciseId);
    setError(null);
    try {
      const res = await fetch("/api/commander/assignments", {
        method: isAssigned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise_id: exerciseId, learner_id: learnerId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "הפעולה נכשלה");
      }
    } catch {
      setError("הפעולה נכשלה — בדקו את החיבור");
    } finally {
      setPendingId(null);
    }
  }

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        עדיין לא יצרת תרגילים לשליחה.{" "}
        <a href="/commander/exercises/new" className="font-medium text-blue-600 hover:underline">
          צרו תרגיל ראשון
        </a>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {exercises.map((exercise) => {
        const isAssigned = assigned.has(exercise.id);
        return (
          <div
            key={exercise.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2.5"
          >
            <div>
              <p className="text-sm font-medium">{exercise.title}</p>
              <p className="text-xs text-gray-500">
                {EXERCISE_MODE_LABELS_HE[exercise.mode]} ·{" "}
                {EXERCISE_TYPE_LABELS_HE[exercise.type]} · {exercise.items.length} פריטים
              </p>
            </div>
            <button
              type="button"
              disabled={pendingId === exercise.id}
              onClick={() => toggle(exercise.id, isAssigned)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                isAssigned
                  ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {pendingId === exercise.id ? "..." : isAssigned ? "ביטול השליחה" : "שליחה לחייל"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
