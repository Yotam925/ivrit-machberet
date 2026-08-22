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
  created_at: string;
};

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

export type ExerciseType = "flashcards" | "quiz";

export type FlashcardItem = { term: string; definition: string };

export type QuizItem = { question: string; options: string[]; correctIndex: number };

export type ExerciseRecord = {
  id: string;
  title: string;
  type: ExerciseType;
  created_by: string;
  items: FlashcardItem[] | QuizItem[];
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
