"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EXERCISE_MODE_LABELS_HE, type ExerciseMode, type ExerciseType } from "@/lib/supabase/types";

type FlashcardDraft = { term: string; definition: string };
type QuizDraft = { question: string; options: string[]; correctIndex: number };

function emptyFlashcards(count: number): FlashcardDraft[] {
  return Array.from({ length: count }, () => ({ term: "", definition: "" }));
}

function emptyQuizItem(): QuizDraft {
  return { question: "", options: ["", "", "", ""], correctIndex: 0 };
}

function emptyQuiz(count: number): QuizDraft[] {
  return Array.from({ length: count }, () => emptyQuizItem());
}

export function ExerciseBuilderForm() {
  const router = useRouter();
  const [type, setType] = useState<ExerciseType>("flashcards");
  const [mode, setMode] = useState<ExerciseMode>("exercise");
  const [title, setTitle] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardDraft[]>(emptyFlashcards(10));
  const [quiz, setQuiz] = useState<QuizDraft[]>(emptyQuiz(10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateFlashcard(index: number, field: keyof FlashcardDraft, value: string) {
    setFlashcards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card)),
    );
  }

  function addFlashcard() {
    setFlashcards((prev) => [...prev, { term: "", definition: "" }]);
  }

  function removeFlashcard(index: number) {
    setFlashcards((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuizQuestion(index: number, question: string) {
    setQuiz((prev) => prev.map((q, i) => (i === index ? { ...q, question } : q)));
  }

  function updateQuizOption(qIndex: number, oIndex: number, value: string) {
    setQuiz((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q,
      ),
    );
  }

  function updateQuizCorrect(qIndex: number, correctIndex: number) {
    setQuiz((prev) => prev.map((q, i) => (i === qIndex ? { ...q, correctIndex } : q)));
  }

  function addQuizQuestion() {
    setQuiz((prev) => [...prev, emptyQuizItem()]);
  }

  function removeQuizQuestion(index: number) {
    setQuiz((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("יש להזין כותרת לתרגיל");
      return;
    }

    let items: FlashcardDraft[] | QuizDraft[];

    if (type === "flashcards") {
      const cleaned = flashcards.filter((c) => c.term.trim() && c.definition.trim());
      if (cleaned.length === 0) {
        setError("יש למלא לפחות כרטיסייה אחת (מונח + הגדרה)");
        return;
      }
      items = cleaned;
    } else {
      const cleaned = quiz.filter((q) => q.question.trim());
      if (cleaned.length === 0) {
        setError("יש למלא לפחות שאלה אחת");
        return;
      }
      for (const q of cleaned) {
        const filledOptions = q.options.filter((o) => o.trim());
        if (filledOptions.length < 2) {
          setError(`השאלה "${q.question}" חייבת לפחות שתי תשובות`);
          return;
        }
        if (!q.options[q.correctIndex]?.trim()) {
          setError(`יש לבחור תשובה נכונה עבור השאלה "${q.question}"`);
          return;
        }
      }
      items = cleaned.map((q) => ({
        question: q.question,
        options: q.options.filter((o) => o.trim()),
        correctIndex: q.options
          .filter((o) => o.trim())
          .indexOf(q.options[q.correctIndex]),
      }));
    }

    setSubmitting(true);
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, mode, items }),
    });
    setSubmitting(false);

    if (res.ok) {
      router.push("/commander/exercises");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "יצירת התרגיל נכשלה");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">כותרת</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2"
          placeholder="לדוגמה: אוצר מילים - יחידה 3"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">סוג</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setType("flashcards")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              type === "flashcards"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600"
            }`}
          >
            כרטיסיות (Flashcards)
          </button>
          <button
            type="button"
            onClick={() => setType("quiz")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              type === "quiz"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 text-gray-600"
            }`}
          >
            מבחן אמריקאי
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">האם זה תרגיל (לתרגול חופשי) או מבחן (רשמי)?</label>
        <div className="flex gap-3">
          {(Object.keys(EXERCISE_MODE_LABELS_HE) as ExerciseMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                mode === option
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-600"
              }`}
            >
              {EXERCISE_MODE_LABELS_HE[option]}
            </button>
          ))}
        </div>
      </div>

      {type === "flashcards" ? (
        <div className="flex flex-col gap-3">
          {flashcards.map((card, index) => (
            <div key={index} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
              <span className="mt-2 w-6 shrink-0 text-sm text-gray-400">{index + 1}.</span>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <input
                  value={card.term}
                  onChange={(e) => updateFlashcard(index, "term", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="מונח / שאלה"
                />
                <input
                  value={card.definition}
                  onChange={(e) => updateFlashcard(index, "definition", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="הגדרה / תשובה"
                />
              </div>
              <button
                type="button"
                onClick={() => removeFlashcard(index)}
                className="mt-2 shrink-0 text-sm text-red-600 hover:underline"
              >
                הסר
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFlashcard}
            className="self-start text-sm font-medium text-blue-600 hover:underline"
          >
            + הוסף כרטיסייה
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {quiz.map((q, qIndex) => (
            <div key={qIndex} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-sm text-gray-400">{qIndex + 1}.</span>
                <input
                  value={q.question}
                  onChange={(e) => updateQuizQuestion(qIndex, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="נוסח השאלה"
                />
                <button
                  type="button"
                  onClick={() => removeQuizQuestion(qIndex)}
                  className="shrink-0 text-sm text-red-600 hover:underline"
                >
                  הסר
                </button>
              </div>
              <div className="flex flex-col gap-1.5 pr-8">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctIndex === oIndex}
                      onChange={() => updateQuizCorrect(qIndex, oIndex)}
                    />
                    <input
                      value={option}
                      onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                      placeholder={`תשובה ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
              <p className="pr-8 text-xs text-gray-500">סמן ליד התשובה הנכונה</p>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuizQuestion}
            className="self-start text-sm font-medium text-blue-600 hover:underline"
          >
            + הוסף שאלה
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "שומר..." : "שמור תרגיל"}
      </button>
    </form>
  );
}
