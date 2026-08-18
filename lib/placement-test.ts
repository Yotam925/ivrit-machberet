export type PlacementQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "q1",
    prompt: "שלום, קוראים לי דוד. מה ___ שלך?",
    options: ["שמך", "שלומך", "ביתך", "ילדך"],
    correctIndex: 0,
  },
  {
    id: "q2",
    prompt: "מה ההפך מהמילה גדול?",
    options: ["קטן", "יפה", "חדש", "טוב"],
    correctIndex: 0,
  },
  {
    id: "q3",
    prompt: "איזו מהמילים הבאות היא מספר?",
    options: ["שולחן", "שלוש", "כחול", "רץ"],
    correctIndex: 1,
  },
  {
    id: "q4",
    prompt: "השלם: אתמול ___ לבית הספר.",
    options: ["הולך", "הלכתי", "אלך", "ללכת"],
    correctIndex: 1,
  },
  {
    id: "q5",
    prompt: "מה עונים כשמישהו אומר לך תודה?",
    options: ["בבקשה", "סליחה", "להתראות", "בוקר טוב"],
    correctIndex: 0,
  },
  {
    id: "q6",
    prompt: "בחר את המשפט הנכון דקדוקית:",
    options: ["היא הולך הביתה", "היא הולכת הביתה", "היא הולכות הביתה", "היא הלך הביתה"],
    correctIndex: 1,
  },
  {
    id: "q7",
    prompt: "מה המשמעות של הפועל להשתתף?",
    options: ["להתחיל", "לקחת חלק", "לעזוב", "לנוח"],
    correctIndex: 1,
  },
  {
    id: "q8",
    prompt: "איזה משפט הכי מתאים למכתב רשמי?",
    options: ["מה קורה אחי", "אני מבקש להודיע כי...", "יאללה ביי", "סבבה, נדבר"],
    correctIndex: 1,
  },
];

export function scoreToLevel(
  correct: number,
  total: number,
): "beginner" | "intermediate" | "advanced" {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio < 0.4) return "beginner";
  if (ratio < 0.8) return "intermediate";
  return "advanced";
}
