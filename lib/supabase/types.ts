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

export type LessonContentSection =
  | { type: "text"; body: string }
  | { type: "vocabulary"; items: { term: string; meaning: string }[] }
  | {
      type: "quiz";
      questions: { prompt: string; options: string[]; correctIndex: number }[];
    };

export type LessonContent = {
  sections: LessonContentSection[];
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
