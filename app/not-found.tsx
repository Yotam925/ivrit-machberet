import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="text-2xl font-bold">הדף לא נמצא</h1>
      <p className="text-gray-600">
        ייתכן שהקישור שגוי, או שאין לכם גישה לתוכן הזה יותר.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          לדף הבית
        </Link>
        <Link href="/learner/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
          אזור החייל
        </Link>
        <Link
          href="/commander/dashboard"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          אזור המפקד
        </Link>
      </div>
    </main>
  );
}
