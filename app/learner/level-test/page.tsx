import { submitPlacementTest } from "./actions";
import { PLACEMENT_QUESTIONS } from "@/lib/placement-test";

type SearchParams = {
  error?: string;
};

export default function LevelTestPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold">מבחן רמה</h1>
        <p className="mt-1 text-gray-600">
          ענה/י על השאלות כדי שנוכל להתאים לך שיעורים ברמה הנכונה
        </p>
      </div>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{searchParams.error}</p>
      )}

      <form action={submitPlacementTest} className="flex flex-col gap-8">
        {PLACEMENT_QUESTIONS.map((question, index) => (
          <fieldset key={question.id} className="flex flex-col gap-3">
            <legend className="font-medium text-gray-800">
              {index + 1}. {question.prompt}
            </legend>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2">
                  <input type="radio" name={`q_${question.id}`} value={optionIndex} required />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          סיום המבחן
        </button>
      </form>
    </main>
  );
}
