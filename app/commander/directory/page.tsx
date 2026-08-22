import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { LEVEL_LABELS_HE, type SoldierSummary, type UserLevel } from "@/lib/supabase/types";
import { LinkSoldierButton } from "@/components/commander/LinkSoldierButton";

export default async function CommanderDirectoryPage() {
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

  // every soldier on the site — RLS exposes learner rows to commanders only
  const { data: learners } = await supabase
    .from("profiles")
    .select("id, full_name, native_language, level, commander_id, created_at")
    .eq("role", "learner")
    .order("full_name", { ascending: true });

  const soldiers = (learners ?? []) as SoldierSummary[];

  // names of the other commanders, so "taken" rows say by whom
  const otherCommanderIds = Array.from(
    new Set(
      soldiers
        .map((s) => s.commander_id)
        .filter((id): id is string => !!id && id !== user.id),
    ),
  );
  const { data: commanderRows } = otherCommanderIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", otherCommanderIds)
    : { data: [] };
  const commanderNames = new Map(
    ((commanderRows ?? []) as { id: string; full_name: string }[]).map((c) => [c.id, c.full_name]),
  );

  const mine = soldiers.filter((s) => s.commander_id === user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">מאגר החיילים</h1>
        <p className="mt-1 text-sm text-gray-600">
          כל מי שנרשם לאתר כחייל. שייכו חייל/ת אליכם כדי לראות את הרמה והציונים ולשלוח תרגילים
          אישיים. כרגע {mine.length} מתוך {soldiers.length} משויכים אליכם. חייל/ת שכבר משויכ/ת
          למפקד/ת אחר/ת יש לבקש מהם לשחרר תחילה.
        </p>
      </div>

      {soldiers.length === 0 ? (
        <p className="text-gray-600">עדיין לא נרשמו חיילים לאתר.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {soldiers.map((soldier) => {
            const state =
              soldier.commander_id === user.id
                ? "mine"
                : soldier.commander_id
                  ? "other"
                  : "free";
            return (
              <li
                key={soldier.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {state === "mine" ? (
                      <Link
                        href={`/commander/soldiers/${soldier.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {soldier.full_name}
                      </Link>
                    ) : (
                      <p className="font-medium">{soldier.full_name}</p>
                    )}
                    {state === "mine" && (
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        במרחב שלי
                      </span>
                    )}
                    {state === "other" && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        אצל {commanderNames.get(soldier.commander_id!) ?? "מפקד/ת אחר/ת"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {state === "mine"
                      ? `${
                          soldier.level
                            ? `רמה: ${LEVEL_LABELS_HE[soldier.level as UserLevel]}`
                            : "טרם עבר/ה מבחן רמה"
                        }${soldier.native_language ? ` · שפת אם: ${soldier.native_language}` : ""}`
                      : state === "other"
                        ? "משויך/ת למפקד/ת אחר/ת"
                        : "פנוי/ה לשיוך"}
                  </p>
                </div>
                <LinkSoldierButton
                  learnerId={soldier.id}
                  soldierName={soldier.full_name}
                  state={state}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/commander/soldiers" className="text-sm font-medium text-blue-600 hover:underline">
        חזרה לחיילים שלי
      </Link>
    </main>
  );
}
