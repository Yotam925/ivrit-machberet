import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { InviteCodePanel } from "@/components/commander/InviteCodePanel";

export default async function CommanderDashboardPage() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">
        ברוכים הבאים{profile?.full_name ? `, ${profile.full_name}` : ""}!
      </h1>
      <p className="text-gray-600">
        המרחב שלכם — החיילים שלכם, הציונים שלהם והתוכן שאתם שולחים.
      </p>
      <Link
        href="/commander/soldiers"
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        החיילים שלי
      </Link>
      <Link
        href="/commander/exercises/new"
        className="rounded-lg border border-blue-600 px-5 py-2.5 font-medium text-blue-600 hover:bg-blue-50"
      >
        + יצירת תרגיל/מבחן
      </Link>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <Link href="/commander/exercises" className="text-sm font-medium text-blue-600 hover:underline">
          התרגילים שיצרתי
        </Link>
        <Link href="/commander/directory" className="text-sm font-medium text-blue-600 hover:underline">
          מאגר החיילים
        </Link>
      </div>
      <InviteCodePanel />
      <form action={signOut}>
        <button type="submit" className="text-sm font-medium text-blue-600 hover:underline">
          התנתקות
        </button>
      </form>
    </main>
  );
}
