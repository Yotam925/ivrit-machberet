"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EXERCISE_MODE_LABELS_HE,
  type ExerciseMode,
  type ExerciseType,
} from "@/lib/supabase/types";
import { CardStack } from "@/components/exercises/CardStack";

type FlashcardDraft = { term: string; definition: string };
type QuizDraft = { question: string; options: string[]; correctIndex: number };
type ReadingDraft = { title: string; body: string };

function emptyFlashcards(count: number): FlashcardDraft[] {
  return Array.from({ length: count }, () => ({ term: "", definition: "" }));
}

function emptyQuizItem(): QuizDraft {
  return { question: "", options: ["", "", "", ""], correctIndex: 0 };
}

function emptyQuiz(count: number): QuizDraft[] {
  return Array.from({ length: count }, () => emptyQuizItem());
}

function emptyReading(count: number): ReadingDraft[] {
  return Array.from({ length: count }, () => ({ title: "", body: "" }));
}

export function ExerciseBuilderForm() {
  const router = useRouter();
  const [type, setType] = useState<ExerciseType>("flashcards");
  const [mode, setMode] = useState<ExerciseMode>("exercise");
  const [title, setTitle] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardDraft[]>(emptyFlashcards(10));
  const [quiz, setQuiz] = useState<QuizDraft[]>(emptyQuiz(10));
  const [reading, setReading] = useState<ReadingDraft[]>(emptyReading(3));
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

  function updateReading(index: number, field: keyof ReadingDraft, value: string) {
    setReading((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addReading() {
    setReading((prev) => [...prev, { title: "", body: "" }]);
  }

  function removeReading(index: number) {
    setReading((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);

    if (!title.trim()) {
      setError("יש להזין כותרת לתרגיל");
      return;
    }

    let items: FlashcardDraft[] | QuizDraft[] | ReadingDraft[];

    if (type === "flashcards") {
      const cleaned = flashcards.filter((c) => c.term.trim() && c.definition.trim());
      if (cleaned.length === 0) {
        setError("יש למלא לפחות כרטיסייה אחת (מונח + הגדרה)");
        return;
      }
      items = cleaned;
    } else if (type === "reading") {
      const cleaned = reading.filter((p) => p.title.trim() && p.body.trim());
      if (cleaned.length === 0) {
        setError("יש למלא לפחות קטע קריאה אחד (כותרת + תוכן)");
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
      // remap correctIndex by POSITION, not by value — indexOf would point at
      // the first duplicate when two options share the same text
      items = cleaned.map((q) => {
        const kept = q.options.map((option, i) => ({ option, i })).filter((x) => x.option.trim());
        return {
          question: q.question,
          options: kept.map((x) => x.option),
          correctIndex: kept.findIndex((x) => x.i === q.correctIndex),
        };
      });
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, mode, items }),
      });

      if (res.ok) {
        router.push("/commander/exercises");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "יצירת התרגיל נכשלה");
      }
    } catch {
      setError("יצירת התרגיל נכשלה — בדקו את החיבור לאינטרנט ונסו שוב");
    } finally {
      setSubmitting(false);
    }
  }

  const flashcardCards = flashcards.map((card, index) => ({
    key: `fc-${index}`,
    content: (
      <>
        <p className="alm-card__date alm-reveal d1">
          כרטיסייה {index + 1} מתוך {flashcards.length}
        </p>
        <div className="alm-card__fields alm-reveal d2">
          <input
            value={card.term}
            onChange={(e) => updateFlashcard(index, "term", e.target.value)}
            className="alm-input"
            placeholder="מונח / שאלה"
            aria-label={`כרטיסייה ${index + 1} — מונח`}
          />
          <input
            value={card.definition}
            onChange={(e) => updateFlashcard(index, "definition", e.target.value)}
            className="alm-input"
            placeholder="הגדרה / תשובה"
            aria-label={`כרטיסייה ${index + 1} — הגדרה`}
          />
        </div>
        <div className="alm-card__foot alm-reveal d3">
          <button type="button" onClick={() => removeFlashcard(index)} className="alm-tag">
            הסרת כרטיסייה
          </button>
        </div>
      </>
    ),
  }));

  const readingCards = reading.map((passage, index) => ({
    key: `rd-${index}`,
    content: (
      <>
        <p className="alm-card__date alm-reveal d1">
          קטע {index + 1} מתוך {reading.length}
        </p>
        <div className="alm-card__fields alm-reveal d2">
          <input
            value={passage.title}
            onChange={(e) => updateReading(index, "title", e.target.value)}
            className="alm-input"
            placeholder="כותרת הקטע"
            style={{ fontWeight: 600 }}
            aria-label={`קטע ${index + 1} — כותרת`}
          />
          <textarea
            value={passage.body}
            onChange={(e) => updateReading(index, "body", e.target.value)}
            className="alm-input"
            placeholder="תוכן הקטע לקריאה..."
            rows={7}
            aria-label={`קטע ${index + 1} — תוכן`}
          />
        </div>
        <div className="alm-card__foot alm-reveal d3">
          <button type="button" onClick={() => removeReading(index)} className="alm-tag">
            הסרת קטע
          </button>
        </div>
      </>
    ),
  }));

  const quizCards = quiz.map((q, qIndex) => ({
    key: `qz-${qIndex}`,
    content: (
      <>
        <p className="alm-card__date alm-reveal d1">
          שאלה {qIndex + 1} מתוך {quiz.length}
        </p>
        <div className="alm-card__fields alm-reveal d2">
          <input
            value={q.question}
            onChange={(e) => updateQuizQuestion(qIndex, e.target.value)}
            className="alm-input"
            placeholder="נוסח השאלה"
            style={{ fontWeight: 600 }}
            aria-label={`שאלה ${qIndex + 1} — נוסח השאלה`}
          />
          {q.options.map((option, oIndex) => (
            <div key={oIndex} className="alm-optionrow">
              <input
                type="radio"
                name={`correct-${qIndex}`}
                checked={q.correctIndex === oIndex}
                onChange={() => updateQuizCorrect(qIndex, oIndex)}
                aria-label={`סמנו את תשובה ${oIndex + 1} של שאלה ${qIndex + 1} כנכונה`}
              />
              <input
                value={option}
                onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)}
                className="alm-input"
                placeholder={`תשובה ${oIndex + 1}`}
                aria-label={`שאלה ${qIndex + 1} — תשובה ${oIndex + 1}`}
              />
            </div>
          ))}
          <p className="alm-card__date" style={{ margin: 0 }}>
            סמנו את העיגול שליד התשובה הנכונה
          </p>
        </div>
        <div className="alm-card__foot alm-reveal d3">
          <button type="button" onClick={() => removeQuizQuestion(qIndex)} className="alm-tag">
            הסרת שאלה
          </button>
        </div>
      </>
    ),
  }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="alm-intro">
        <p className="alm-intro__eyebrow">אזור המפקד · {EXERCISE_MODE_LABELS_HE[mode]}</p>
        <h1 className="alm-intro__title">צור תרגיל/מבחן</h1>
        <p className="alm-intro__sub">
          כל שאלה היא כרטיס — בדיוק כמו שהחיילים שלכם יראו אותה. גללו כדי לעבור בין הכרטיסים,
          מלאו אותם, ובסוף שמרו.
        </p>
      </div>

      <div className="alm-panel">
        <div>
          <p className="alm-label">כותרת</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="alm-input"
            placeholder="לדוגמה: אוצר מילים - יחידה 3"
            style={{ marginTop: 8 }}
            aria-label="כותרת התרגיל"
          />
        </div>
        <div>
          <p className="alm-label">סוג</p>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setType("flashcards")}
              className={`alm-choice ${type === "flashcards" ? "-active" : ""}`}
            >
              כרטיסיות (Flashcards)
            </button>
            <button
              type="button"
              onClick={() => setType("quiz")}
              className={`alm-choice ${type === "quiz" ? "-active" : ""}`}
            >
              מבחן אמריקאי
            </button>
            <button
              type="button"
              onClick={() => setType("reading")}
              className={`alm-choice ${type === "reading" ? "-active" : ""}`}
            >
              קטעי קריאה
            </button>
          </div>
        </div>
        <div>
          <p className="alm-label">תרגיל או מבחן?</p>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {(Object.keys(EXERCISE_MODE_LABELS_HE) as ExerciseMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`alm-choice ${mode === option ? "-active" : ""}`}
              >
                {EXERCISE_MODE_LABELS_HE[option]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {type === "flashcards" && (
        <CardStack key="flashcards" cards={flashcardCards} cardLabel="כרטיסייה" />
      )}
      {type === "quiz" && <CardStack key="quiz" cards={quizCards} cardLabel="שאלה" />}
      {type === "reading" && <CardStack key="reading" cards={readingCards} cardLabel="קטע" />}

      <div className="alm-actions">
        <button
          type="button"
          onClick={
            type === "flashcards" ? addFlashcard : type === "reading" ? addReading : addQuizQuestion
          }
          className="alm-secondary"
        >
          {type === "flashcards"
            ? "+ הוספת כרטיסייה"
            : type === "reading"
              ? "+ הוספת קטע"
              : "+ הוספת שאלה"}
        </button>
        {error && (
          <p className="alm-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} className="alm-primary">
          {submitting ? "שומר..." : "שמירת התרגיל"}
        </button>
        <Link href="/commander/exercises" className="alm-secondary">
          ביטול
        </Link>
      </div>
    </form>
  );
}
