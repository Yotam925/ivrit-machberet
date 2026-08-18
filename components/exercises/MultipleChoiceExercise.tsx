"use client";

import { useState } from "react";

export function MultipleChoiceExercise({
  prompt,
  options,
  correctIndex,
  onComplete,
}: {
  prompt: string;
  options: string[];
  correctIndex: number;
  onComplete: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  function handleCheck() {
    if (selected === null) return;
    setChecked(true);
    onComplete(selected === correctIndex);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-medium">{prompt}</p>
      <div className="flex flex-col gap-2">
        {options.map((option, i) => {
          const isSelected = selected === i;
          const showCorrect = checked && i === correctIndex;
          const showWrong = checked && isSelected && i !== correctIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={checked}
              onClick={() => setSelected(i)}
              className={`rounded-lg border px-4 py-2 text-right transition ${
                showCorrect
                  ? "border-green-500 bg-green-50"
                  : showWrong
                    ? "border-red-500 bg-red-50"
                    : isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {!checked && (
        <button
          type="button"
          disabled={selected === null}
          onClick={handleCheck}
          className="self-start rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-40"
        >
          בדיקה
        </button>
      )}
    </div>
  );
}
