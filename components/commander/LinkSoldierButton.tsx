"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LinkSoldierButton({
  learnerId,
  soldierName,
  state,
  afterUnlink,
}: {
  learnerId: string;
  soldierName: string;
  /** "mine" — already under me, "free" — unassigned, "other" — under a different commander */
  state: "mine" | "free" | "other";
  /** where to go after a successful unlink; without it the page just refreshes */
  afterUnlink?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "POST" | "DELETE") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/commander/soldiers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learner_id: learnerId }),
      });
      if (res.ok) {
        if (method === "DELETE" && afterUnlink) {
          router.push(afterUnlink);
        }
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "הפעולה נכשלה");
      }
    } catch {
      setError("הפעולה נכשלה — בדקו את החיבור");
    } finally {
      setPending(false);
    }
  }

  if (state === "mine") {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          disabled={pending}
          aria-label={`הסרת ${soldierName} מהמרחב שלי`}
          onClick={() => {
            if (
              confirm(
                `להסיר את ${soldierName} מהמרחב שלך?\n\nהתרגילים והמשימות ששלחת יפסיקו להופיע אצלם. הציונים יישמרו, ואפשר לשייך מחדש בכל רגע.`,
              )
            ) {
              call("DELETE");
            }
          }}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {pending ? "מסיר..." : "הסרה מהמרחב שלי"}
        </button>
        {error && (
          <span className="text-xs text-red-600" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  if (state === "other") {
    return (
      <span className="text-xs text-gray-500">
        משויך/ת למפקד/ת אחר/ת — יש לבקש מהם לשחרר
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        aria-label={`שיוך ${soldierName} אליי`}
        onClick={() => call("POST")}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "משייך..." : "שיוך אליי"}
      </button>
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
