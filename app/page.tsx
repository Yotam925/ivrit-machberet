import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">עברית מחברת</h1>
      <p className="text-lg text-gray-600">
        פלטפורמה ללימוד עברית, הכנה לצה&quot;ל, והיכרות עם החברה הישראלית וציונות —
        לבני מיעוטים, עולים חדשים ומועמדים לשירות.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          התחברות
        </Link>
        <Link
          href="/login?mode=signup"
          className="rounded-lg border border-blue-600 px-6 py-2 font-medium text-blue-600 transition hover:bg-blue-50"
        >
          הרשמה
        </Link>
      </div>
    </main>
  );
}
