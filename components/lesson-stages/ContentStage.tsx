import type { LessonStage } from "@/lib/supabase/types";

type ContentStageData = Extract<LessonStage, { kind: "content" }>;

export function ContentStage({
  stage,
  onContinue,
}: {
  stage: ContentStageData;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{stage.title}</h2>
      {stage.sections.map((block, i) => {
        if (block.type === "text") {
          return (
            <p key={i} className="text-gray-700">
              {block.body}
            </p>
          );
        }
        return (
          <div key={i} className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-gray-50 p-4">
            {block.items.map((item, j) => (
              <div key={j} className="contents">
                <span className="font-medium">{item.term}</span>
                <span className="text-gray-600">{item.meaning}</span>
              </div>
            ))}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onContinue}
        className="self-start rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
      >
        המשך
      </button>
    </div>
  );
}
