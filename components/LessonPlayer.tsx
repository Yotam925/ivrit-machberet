"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VideoStage } from "@/components/lesson-stages/VideoStage";
import { ContentStage } from "@/components/lesson-stages/ContentStage";
import { ExerciseStage } from "@/components/lesson-stages/ExerciseStage";
import { ReflectionStage } from "@/components/lesson-stages/ReflectionStage";
import { completeLessonAction } from "@/app/learner/lessons/[id]/actions";
import type { Lesson } from "@/lib/supabase/types";

const STAGE_LABELS: Record<string, string> = {
  video: "וידאו",
  content: "תוכן",
  practice: "תרגול",
  questions: "שאלות",
  reflection: "משימת חשיבה",
};

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const stages = lesson.content.stages;
  const [stageIndex, setStageIndex] = useState(0);
  const [questionsScore, setQuestionsScore] = useState<{ correct: number; total: number } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const stage = stages[stageIndex];
  const isLastStage = stageIndex === stages.length - 1;

  async function finishLesson(finalScore: { correct: number; total: number } | null) {
    setSaving(true);
    setSaveError(null);
    const scorePercent = finalScore
      ? Math.round((finalScore.correct / finalScore.total) * 100)
      : null;
    const result = await completeLessonAction(lesson.id, scorePercent);
    setSaving(false);
    if (result?.error) {
      setSaveError(result.error);
      return;
    }
    router.push("/learner/lessons");
  }

  // freshQuestionsScore lets the "questions" stage hand its just-computed
  // score straight through, instead of relying on the questionsScore state
  // set a moment earlier in the same callback — that state update wouldn't
  // be visible yet if this turned out to be the last stage and we read
  // questionsScore from the closure in the same tick.
  function goNext(freshQuestionsScore?: { correct: number; total: number }) {
    if (isLastStage) {
      void finishLesson(freshQuestionsScore ?? questionsScore);
    } else {
      setStageIndex((i) => i + 1);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <div className="mb-1 flex justify-between text-sm text-gray-500">
          <span>{lesson.title}</span>
          <span>
            שלב {stageIndex + 1} מתוך {stages.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-400">
          {stages.map((s, i) => (
            <span key={i} className={i <= stageIndex ? "font-medium text-blue-600" : ""}>
              {STAGE_LABELS[s.kind] ?? s.kind}
              {i < stages.length - 1 ? " ›" : ""}
            </span>
          ))}
        </div>
      </div>

      {stage.kind === "video" && <VideoStage stage={stage} onContinue={() => goNext()} />}
      {stage.kind === "content" && <ContentStage stage={stage} onContinue={() => goNext()} />}
      {(stage.kind === "practice" || stage.kind === "questions") && (
        <ExerciseStage
          key={stageIndex}
          title={stage.title}
          exercises={stage.exercises}
          onStageComplete={(result) => {
            if (stage.kind === "questions") {
              setQuestionsScore(result);
              goNext(result);
            } else {
              goNext();
            }
          }}
        />
      )}
      {stage.kind === "reflection" && (
        <ReflectionStage stage={stage} onContinue={() => goNext()} />
      )}

      {saveError && <p className="text-sm text-red-700">{saveError}</p>}
      {saving && <p className="text-sm text-gray-500">שומר...</p>}
    </div>
  );
}
