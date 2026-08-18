"use client";

import { useState } from "react";
import type { LessonStage } from "@/lib/supabase/types";

type ReflectionStageData = Extract<LessonStage, { kind: "reflection" }>;

export function ReflectionStage({
  stage,
  onContinue,
}: {
  stage: ReflectionStageData;
  onContinue: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{stage.title}</h2>
      <p className="text-gray-700">{stage.prompt}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="כתבו כאן את המחשבות שלכם (לא חובה)..."
        className="rounded-lg border border-gray-300 px-3 py-2"
      />
      <button
        type="button"
        onClick={onContinue}
        className="self-start rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
      >
        סיום היחידה
      </button>
    </div>
  );
}
