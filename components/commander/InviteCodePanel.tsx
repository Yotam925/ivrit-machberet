import { createClient } from "@/lib/supabase/server";

/** Commanders are invite-only; this shows the code they can pass to a colleague. */
export async function InviteCodePanel() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_commander_invites");

  if (error || !data || data.length === 0) return null;

  const codes = data as { code: string; note: string | null; uses: number }[];

  return (
    <div className="w-full rounded-xl border border-gray-200 px-5 py-4 text-start">
      <p className="text-sm font-bold">קוד הזמנה למפקדים חדשים</p>
      <p className="mt-1 text-xs text-gray-600">
        חשבון מפקד/ת נפתח רק עם הקוד הזה — הוא נותן גישה לפרטי החיילים, אז שתפו אותו רק עם מי
        שאמור לקבל גישה.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {codes.map((invite) => (
          <li key={invite.code} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <code
              dir="ltr"
              className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-800"
            >
              {invite.code}
            </code>
            <span className="text-xs text-gray-500">
              {invite.uses === 0 ? "טרם היה בשימוש" : `בשימוש ${invite.uses} פעמים`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
