import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import {
  LEVEL_LABELS_HE,
  type ExerciseAttempt,
  type SoldierSummary,
  type UserLevel,
} from "@/lib/supabase/types";

export default async function CommanderSoldiersPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: soldiers } = await supabase
    .from("profiles")
    .select("id, full_name, native_language, level, commander_id, created_at")
    .eq("commander_id", user.id)
    .order("full_name", { ascending: true });

  const roster = (soldiers ?? []) as SoldierSummary[];

  // one round trip for every soldier's grades, then grouped in memory
  const ids = roster.map((s) => s.id);
  const { data: attemptRows } = ids.length
    ? await supabase
        .from("exercise_attempts")
        .select("id, exercise_id, user_id, score, total, created_at")
        .in("user_id", ids)
        .order("created_at", { ascending: true })
    : { data: [] };

  const byUser = new Map<string, ExerciseAttempt[]>();
  for (const attempt of (attemptRows ?? []) as ExerciseAttempt[]) {
    const list = byUser.get(attempt.user_id) ?? [];
    list.push(attempt);
    byUser.set(attempt.user_id, list);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">החיילים שלי</h1>
        <Link
          href="/commander/directory"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + שיוך חייל מהמאגר
        </Link>
      </div>

      {roster.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
          <p className="font-medium">עדיין אין חיילים במרחב שלך.</p>
          <p className="mt-1 text-sm text-gray-600">
            כל מי שנרשם לאתר כחייל מופיע במאגר — משם אפשר לשייך אותו אליך.
          </p>
          <Link
            href="/commander/directory"
            className="mt-4 inline-block font-medium text-blue-600 hover:underline"
          >
            למאגר החיילים
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {roster.map((soldier) => {
            const attempts = byUser.get(soldier.id) ?? [];
            const last = attempts[attempts.length - 1];
            const lastPct = last ? Math.round((last.score / last.total) * 100) : null;
            return (
              <li key={soldier.id}>
                <Link
                  href={`/commander/soldiers/${soldier.id}`}
                  className="group block rounded-lg border border-gray-200 px-4 py-3 transition hover:border-blue-400"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium group-hover:text-blue-700">{soldier.full_name}</p>
                    <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-700">
                      {soldier.level
                        ? `רמה: ${LEVEL_LABELS_HE[soldier.level as UserLevel]}`
                        : "טרם עבר/ה מבחן רמה"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {attempts.length === 0
                      ? "טרם הגיש/ה מבחנים"
                      : `${attempts.length} הגשות · אחרונה: ${lastPct}%`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/commander/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
        חזרה לדף הבית
      </Link>
    </main>
  );
}
