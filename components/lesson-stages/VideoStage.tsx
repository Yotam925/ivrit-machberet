import type { LessonStage } from "@/lib/supabase/types";

type VideoStageData = Extract<LessonStage, { kind: "video" }>;

export function VideoStage({
  stage,
  onContinue,
}: {
  stage: VideoStageData;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{stage.title}</h2>
      {stage.videoUrl ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video controls className="w-full rounded-lg" src={stage.videoUrl} />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-500">
          <span className="text-3xl">🎬</span>
          <span>וידאו יתווסף בהמשך</span>
        </div>
      )}
      {stage.description && <p className="text-gray-600">{stage.description}</p>}
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
