export type UserRole = "learner" | "commander";
export type UserLevel = "beginner" | "intermediate" | "advanced";

export const LEVEL_LABELS_HE: Record<UserLevel, string> = {
  beginner: "מתחיל/ה",
  intermediate: "בינוני/ת",
  advanced: "מתקדם/ת",
};

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  native_language: string | null;
  level: UserLevel | null;
  commander_id: string | null;
  created_at: string;
};

export type CommanderOption = { id: string; full_name: string };

export type LessonCategory = "hebrew" | "army" | "zionism";

export type ContentBlock =
  | { type: "text"; body: string }
  | { type: "vocabulary"; items: { term: string; meaning: string }[] };

export type Exercise =
  | { type: "multiple_choice"; prompt: string; options: string[]; correctIndex: number }
  | {
      type: "fill_blank";
      sentenceBefore: string;
      sentenceAfter: string;
      options: string[];
      correctIndex: number;
    }
  | { type: "matching"; pairs: { left: string; right: string }[] };

export type LessonStage =
  | { kind: "video"; title: string; videoUrl: string | null; description?: string }
  | { kind: "content"; title: string; sections: ContentBlock[] }
  | { kind: "practice"; title: string; exercises: Exercise[] }
  | { kind: "questions"; title: string; exercises: Exercise[] }
  | { kind: "reflection"; title: string; prompt: string };

export type LessonContent = {
  stages: LessonStage[];
};

export type Lesson = {
  id: string;
  title: string;
  category: LessonCategory;
  level: UserLevel;
  sort_order: number;
  content: LessonContent;
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  score: number | null;
  completed_at: string | null;
};

export type ExerciseType = "flashcards" | "quiz" | "reading";
export type ExerciseMode = "exercise" | "test";

export const EXERCISE_MODE_LABELS_HE: Record<ExerciseMode, string> = {
  exercise: "תרגיל",
  test: "מבחן",
};

export const EXERCISE_TYPE_LABELS_HE: Record<ExerciseType, string> = {
  flashcards: "כרטיסיות",
  quiz: "מבחן אמריקאי",
  reading: "קטעי קריאה",
};

export type FlashcardItem = { term: string; definition: string };

export type QuizItem = { question: string; options: string[]; correctIndex: number };

export type ReadingItem = { title: string; body: string };

export type ExerciseRecord = {
  id: string;
  title: string;
  type: ExerciseType;
  mode: ExerciseMode;
  created_by: string;
  items: FlashcardItem[] | QuizItem[] | ReadingItem[];
  created_at: string;
};

export type ExerciseAttempt = {
  id: string;
  /** null once the exercise itself is deleted — the snapshot below survives */
  exercise_id: string | null;
  user_id: string;
  score: number;
  total: number;
  exercise_title: string | null;
  exercise_mode: ExerciseMode | null;
  created_at: string;
};

export type ExerciseAssignment = {
  id: string;
  exercise_id: string;
  learner_id: string;
  assigned_by: string;
  created_at: string;
};

/** A soldier as the commander's roster shows them. */
export type SoldierSummary = {
  id: string;
  full_name: string;
  native_language: string | null;
  level: UserLevel | null;
  commander_id: string | null;
  created_at: string;
};

export function isPlayableLessonContent(content: unknown): content is LessonContent {
  return (
    typeof content === "object" &&
    content !== null &&
    Array.isArray((content as LessonContent).stages) &&
    (content as LessonContent).stages.length > 0
  );
}
