"use client";

import { useState } from "react";

export function FillBlankExercise({
  sentenceBefore,
  sentenceAfter,
  options,
  correctIndex,
  onComplete,
}: {
  sentenceBefore: string;
  sentenceAfter: string;
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
      <p className="text-lg leading-relaxed">
        {sentenceBefore}
        <select
          value={selected ?? ""}
          onChange={(e) => setSelected(Number(e.target.value))}
          disabled={checked}
          className="mx-1 rounded border border-gray-300 px-2 py-1"
        >
          <option value="" disabled>
            בחר/י
          </option>
          {options.map((opt, i) => (
            <option key={i} value={i}>
              {opt}
            </option>
          ))}
        </select>
        {sentenceAfter}
      </p>
      {checked && (
        <p className={selected === correctIndex ? "text-sm text-green-700" : "text-sm text-red-700"}>
          {selected === correctIndex ? "נכון!" : `לא נכון — התשובה הנכונה: ${options[correctIndex]}`}
        </p>
      )}
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
