"use client";

import { useEffect, useState } from "react";

type Pair = { left: string; right: string };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MatchingExercise({
  pairs,
  onComplete,
}: {
  pairs: Pair[];
  onComplete: (correct: boolean) => void;
}) {
  // Start in the unshuffled (deterministic) order so server render and the
  // client's initial hydration render produce identical HTML — reshuffling
  // happens client-only, after mount, in the effect below. Randomizing
  // directly inside a useState initializer here would run once during SSR
  // and again during hydration with a different result each time, which
  // React flags as a hydration mismatch.
  const [rightOrder, setRightOrder] = useState<string[]>(() => pairs.map((p) => p.right));
  useEffect(() => {
    setRightOrder(shuffle(pairs.map((p) => p.right)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [placements, setPlacements] = useState<Record<number, string | null>>(() =>
    Object.fromEntries(pairs.map((_, i) => [i, null])),
  );
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const usedRights = new Set(Object.values(placements).filter(Boolean) as string[]);
  const availableRights = rightOrder.filter((r) => !usedRights.has(r));
  const allPlaced = Object.values(placements).every(Boolean);

  function placeAt(leftIndex: number, rightValue: string) {
    if (checked) return;
    setPlacements((prev) => ({ ...prev, [leftIndex]: rightValue }));
    setSelectedRight(null);
  }

  function clearAt(leftIndex: number) {
    if (checked) return;
    setPlacements((prev) => ({ ...prev, [leftIndex]: null }));
  }

  function handleCheck() {
    const correct = pairs.every((p, i) => placements[i] === p.right);
    setChecked(true);
    onComplete(correct);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        גררו כל מילה מהעמודה הימנית לתא המתאים לה בעמודה השמאלית, או לחצו על מילה
        ואז על התא המתאים.
      </p>
      <div className="flex gap-6">
        <div className="flex flex-1 flex-col gap-2">
          {pairs.map((pair, i) => (
            <div
              key={pair.left}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const value = e.dataTransfer.getData("text/plain");
                if (value) placeAt(i, value);
              }}
              onClick={() => {
                if (selectedRight) placeAt(i, selectedRight);
                else if (placements[i]) clearAt(i);
              }}
              className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${
                checked
                  ? placements[i] === pair.right
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
            >
              <span className="font-medium">{pair.left}</span>
              <span className="text-gray-500">{placements[i] ?? "—"}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {availableRights.map((r) => (
            <div
              key={r}
              draggable={!checked}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", r)}
              onClick={() => !checked && setSelectedRight(r === selectedRight ? null : r)}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center ${
                selectedRight === r ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              {r}
            </div>
          ))}
        </div>
      </div>
      {!checked ? (
        <button
          type="button"
          disabled={!allPlaced}
          onClick={handleCheck}
          className="self-start rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-40"
        >
          בדיקה
        </button>
      ) : null}
    </div>
  );
}
