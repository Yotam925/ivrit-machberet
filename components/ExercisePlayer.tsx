"use client";

import { useState } from "react";
import {
  EXERCISE_MODE_LABELS_HE,
  type ExerciseRecord,
  type FlashcardItem,
  type QuizItem,
} from "@/lib/supabase/types";
import { AlmCheckIcon, AlmPlusIcon, CardStack } from "@/components/exercises/CardStack";

export function ExercisePlayer({ exercise }: { exercise: ExerciseRecord }) {
  if (exercise.type === "flashcards") {
    return <FlashcardStack exercise={exercise} />;
  }
  return <QuizStack exercise={exercise} />;
}

function AlmanacIntro({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="alm-intro">
      <p className="alm-intro__eyebrow">{eyebrow}</p>
      <h1 className="alm-intro__title">{title}</h1>
      <p className="alm-intro__sub">{sub}</p>
    </div>
  );
}

function AnsweredDot({ on }: { on: boolean }) {
  return (
    <span className={`alm-add ${on ? "-saved" : ""}`} aria-hidden="true">
      <AlmPlusIcon />
      <AlmCheckIcon />
    </span>
  );
}

/* ---------- quiz: one question per card ---------- */

function QuizStack({ exercise }: { exercise: ExerciseRecord }) {
  const questions = exercise.items as QuizItem[];
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  function selectAnswer(qIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optionIndex : a)));
  }

  const allAnswered = answers.every((a) => a !== null);
  const unansweredCount = answers.filter((a) => a === null).length;
  const firstUnanswered = answers.findIndex((a) => a === null);
  const score = submitted
    ? answers.filter((a, i) => a === questions[i].correctIndex).length
    : null;

  function scrollToQuestion(index: number) {
    document
      .getElementById(`quiz-question-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const cards = questions.map((q, qIndex) => ({
    key: `q-${qIndex}`,
    content: (
      <>
        <p className="alm-card__date alm-reveal d1" id={`quiz-question-${qIndex}`}>
          שאלה {qIndex + 1} מתוך {questions.length}
        </p>
        <p className="alm-card__text alm-reveal d2">{q.question}</p>
        <div className="alm-card__options alm-reveal d2">
          {q.options.map((option, oIndex) => {
            const isSelected = answers[qIndex] === oIndex;
            const isCorrectOption = q.correctIndex === oIndex;
            let stateClass = "";
            if (submitted) {
              if (isCorrectOption) stateClass = "-correct";
              else if (isSelected) stateClass = "-wrong";
            } else if (isSelected) {
              stateClass = "-selected";
            }
            return (
              <button
                key={oIndex}
                type="button"
                disabled={submitted}
                aria-pressed={isSelected}
                onClick={() => selectAnswer(qIndex, oIndex)}
                className={`alm-option ${stateClass}`}
              >
                {option}
                {submitted && isCorrectOption && (
                  <>
                    {" ✓"}
                    <span className="alm-sr"> — התשובה הנכונה</span>
                  </>
                )}
                {submitted && isSelected && !isCorrectOption && (
                  <>
                    {" ✗"}
                    <span className="alm-sr"> — תשובה שגויה</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div className="alm-card__foot alm-reveal d3">
          <span className="alm-tag">{answers[qIndex] !== null ? "נענתה" : "טרם נענתה"}</span>
          <AnsweredDot on={answers[qIndex] !== null} />
        </div>
      </>
    ),
  }));

  return (
    <>
      <AlmanacIntro
        eyebrow={`${EXERCISE_MODE_LABELS_HE[exercise.mode]} · ${questions.length} שאלות`}
        title={exercise.title}
        sub="גללו כדי לעבור בין השאלות — כל שאלה נצמדת למסך, והבאה עולה מעליה. בסוף, שלחו את התשובות וקבלו ציון."
      />
      <CardStack cards={cards} cardLabel="שאלה" />
      <div className="alm-actions">
        {!submitted ? (
          <>
            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
              className="alm-primary"
            >
              שלחו תשובות
            </button>
            {!allAnswered && (
              <button
                type="button"
                onClick={() => scrollToQuestion(firstUnanswered)}
                className="alm-secondary"
              >
                {unansweredCount === 1
                  ? `נותרה שאלה אחת ללא מענה — לחצו למעבר לשאלה ${firstUnanswered + 1}`
                  : `נותרו ${unansweredCount} שאלות ללא מענה — לחצו למעבר לשאלה ${firstUnanswered + 1}`}
              </button>
            )}
          </>
        ) : (
          <p className="alm-score" role="status">
            התוצאה שלך: {score} מתוך {questions.length}
          </p>
        )}
      </div>
    </>
  );
}

/* ---------- flashcards: one card per… card ---------- */

function FlashcardStack({ exercise }: { exercise: ExerciseRecord }) {
  const items = exercise.items as FlashcardItem[];
  const [flipped, setFlipped] = useState<boolean[]>(items.map(() => false));

  function toggle(index: number) {
    setFlipped((prev) => prev.map((f, i) => (i === index ? !f : f)));
  }

  const cards = items.map((item, index) => ({
    key: `f-${index}`,
    content: (
      <>
        <p className="alm-card__date alm-reveal d1">
          כרטיסייה {index + 1} מתוך {items.length}
        </p>
        <button
          type="button"
          onClick={() => toggle(index)}
          className="alm-flip alm-reveal d2"
          aria-pressed={flipped[index]}
        >
          {flipped[index] ? item.definition : item.term}
        </button>
        <div className="alm-card__foot alm-reveal d3">
          <span className="alm-tag">
            {flipped[index] ? "הגדרה — לחצו לחזרה" : "לחצו על הכרטיסייה כדי להפוך"}
          </span>
          <AnsweredDot on={flipped[index]} />
        </div>
      </>
    ),
  }));

  return (
    <>
      <AlmanacIntro
        eyebrow={`${EXERCISE_MODE_LABELS_HE[exercise.mode]} · ${items.length} כרטיסיות`}
        title={exercise.title}
        sub="גללו כדי לעבור בין הכרטיסיות, ולחצו על כרטיסייה כדי להפוך בין המונח להגדרה."
      />
      <CardStack cards={cards} cardLabel="כרטיסייה" />
    </>
  );
}
