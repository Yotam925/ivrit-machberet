"use client";

import { useState } from "react";
import { EXERCISE_MODE_LABELS_HE, type ExerciseRecord, type FlashcardItem, type QuizItem } from "@/lib/supabase/types";

export function ExercisePlayer({ exercise }: { exercise: ExerciseRecord }) {
  const title = `${EXERCISE_MODE_LABELS_HE[exercise.mode]}: ${exercise.title}`;
  if (exercise.type === "flashcards") {
    return <FlashcardPlayer title={title} cards={exercise.items as FlashcardItem[]} />;
  }
  return <QuizPlayer title={title} questions={exercise.items as QuizItem[]} />;
}

function FlashcardPlayer({ title, cards }: { title: string; cards: FlashcardItem[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  function goTo(newIndex: number) {
    setIndex(newIndex);
    setFlipped(false);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-gray-500">
        כרטיסייה {index + 1} מתוך {cards.length}
      </p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex h-56 w-full max-w-sm items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-center text-xl font-medium shadow-sm hover:border-blue-400"
      >
        {flipped ? card.definition : card.term}
      </button>
      <p className="text-xs text-gray-400">לחץ על הכרטיסייה כדי להפוך</p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          הקודם
        </button>
        <button
          type="button"
          disabled={index === cards.length - 1}
          onClick={() => goTo(index + 1)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          הבא
        </button>
      </div>
    </div>
  );
}

function QuizPlayer({ title, questions }: { title: string; questions: QuizItem[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  function selectAnswer(qIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optionIndex : a)));
  }

  const allAnswered = answers.every((a) => a !== null);
  const score = submitted
    ? answers.filter((a, i) => a === questions[i].correctIndex).length
    : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{title}</h1>

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
          <p className="font-medium">
            {qIndex + 1}. {q.question}
          </p>
          <div className="flex flex-col gap-1.5">
            {q.options.map((option, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              const isCorrectOption = q.correctIndex === oIndex;
              let stateClass = "border-gray-300";
              if (submitted) {
                if (isCorrectOption) stateClass = "border-green-500 bg-green-50";
                else if (isSelected) stateClass = "border-red-500 bg-red-50";
              } else if (isSelected) {
                stateClass = "border-blue-500 bg-blue-50";
              }
              return (
                <button
                  key={oIndex}
                  type="button"
                  onClick={() => selectAnswer(qIndex, oIndex)}
                  className={`rounded-lg border px-3 py-2 text-start text-sm ${stateClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          type="button"
          disabled={!allAnswered}
          onClick={() => setSubmitted(true)}
          className="self-start rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white disabled:opacity-40"
        >
          שלח תשובות
        </button>
      ) : (
        <p className="text-lg font-bold">
          התוצאה שלך: {score} מתוך {questions.length}
        </p>
      )}
    </div>
  );
}
