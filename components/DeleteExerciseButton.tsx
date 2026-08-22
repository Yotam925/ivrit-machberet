"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteExerciseButton({ exerciseId }: { exerciseId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "למחוק את התרגיל?\n\nהתרגיל יוסר מכל החיילים ששלחתם אליו. הציונים שכבר נרשמו יישמרו בהיסטוריה של כל חייל/ת. הפעולה אינה הפיכה.",
      )
    ) {
      return;
    }

    setPending(true);
    const res = await fetch(`/api/exercises/${exerciseId}`, { method: "DELETE" });
    setPending(false);

    if (res.ok) {
      router.refresh();
    } else {
      alert("מחיקת התרגיל נכשלה");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      מחיקה
    </button>
  );
}
