"use client";

import { useState } from "react";
import { MultipleChoiceExercise } from "@/components/exercises/MultipleChoiceExercise";
import { FillBlankExercise } from "@/components/exercises/FillBlankExercise";
import { MatchingExercise } from "@/components/exercises/MatchingExercise";
import type { Exercise } from "@/lib/supabase/types";

export function ExerciseStage({
  title,
  exercises,
  onStageComplete,
}: {
  title: string;
  exercises: Exercise[];
  onStageComplete: (result: { correct: number; total: number }) => void;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);

  const exercise = exercises[index];
  const isLast = index === exercises.length - 1;

  function handleExerciseComplete(correct: boolean) {
    setResults((prev) => [...prev, correct]);
    setAnswered(true);
  }

  function handleNext() {
    if (isLast) {
      // results was just updated by handleExerciseComplete (a prior, separate
      // click event) and this handler is freshly re-created on every render,
      // so it closes over the up-to-date results array here — safe to read
      // directly, unlike reading state back inside the SAME event handler
      // that just called setState.
      const correct = results.filter(Boolean).length;
      onStageComplete({ correct, total: exercises.length });
    } else {
      setIndex((i) => i + 1);
      setAnswered(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="text-sm text-gray-500">
          {index + 1} / {exercises.length}
        </span>
      </div>

      {exercise.type === "multiple_choice" && (
        <MultipleChoiceExercise
          key={index}
          prompt={exercise.prompt}
          options={exercise.options}
          correctIndex={exercise.correctIndex}
          onComplete={handleExerciseComplete}
        />
      )}
      {exercise.type === "fill_blank" && (
        <FillBlankExercise
          key={index}
          sentenceBefore={exercise.sentenceBefore}
          sentenceAfter={exercise.sentenceAfter}
          options={exercise.options}
          correctIndex={exercise.correctIndex}
          onComplete={handleExerciseComplete}
        />
      )}
      {exercise.type === "matching" && (
        <MatchingExercise key={index} pairs={exercise.pairs} onComplete={handleExerciseComplete} />
      )}

      {answered && (
        <button
          type="button"
          onClick={handleNext}
          className="self-start rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          {isLast ? "המשך" : "השאלה הבאה"}
        </button>
      )}
    </div>
  );
}
