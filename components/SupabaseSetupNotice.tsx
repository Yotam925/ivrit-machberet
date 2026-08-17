export function SupabaseSetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-bold">חיבור ל-Supabase עדיין לא הוגדר</h1>
      <p className="text-gray-600">
        כדי שההתחברות תעבוד, צריך ליצור פרויקט Supabase, למלא את הפרטים בקובץ{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5">.env.local</code> ולהריץ את קובץ ה-SQL
        שבתיקיית <code className="rounded bg-gray-100 px-1 py-0.5">supabase/migrations</code>.
      </p>
      <p className="text-sm text-gray-500">ההוראות המלאות נמצאות בקובץ README.md.</p>
    </main>
  );
}
