"use client";

import Link from "next/link";
import { useState } from "react";
import type { ExerciseRecord } from "@/lib/supabase/types";
import { ExercisePlayer } from "@/components/ExercisePlayer";

export function PreviewPlayer({ exercise }: { exercise: ExerciseRecord }) {
  // remounting the player resets every answer / flip, so the commander can
  // run through the same exercise again with different answers
  const [runId, setRunId] = useState(0);

  return (
    <>
      <div className="alm-banner">
        <p className="alm-banner__text">
          תצוגה מקדימה — כך החיילים שלכם רואים את התרגיל. התשובות כאן אינן נשמרות.
        </p>
        <div className="alm-banner__actions">
          <button type="button" onClick={() => setRunId((n) => n + 1)} className="alm-banner__btn">
            התחלה מחדש
          </button>
          <Link href="/commander/exercises" className="alm-banner__btn">
            יציאה מהתצוגה
          </Link>
        </div>
      </div>

      <ExercisePlayer key={runId} exercise={exercise} />
    </>
  );
}
