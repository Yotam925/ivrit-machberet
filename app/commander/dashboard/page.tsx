import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";

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
        ברוך הבא{profile?.full_name ? `, ${profile.full_name}` : ""}!
      </h1>
      <p className="text-gray-600">אזור המפקד/מדריך — בקרוב יתווסף כאן ניהול קבוצה.</p>
      <Link
        href="/commander/exercises/new"
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        + צור תרגיל/מבחן
      </Link>
      <Link href="/commander/exercises" className="text-sm font-medium text-blue-600 hover:underline">
        התרגילים שיצרתי
      </Link>
      <form action={signOut}>
        <button type="submit" className="text-sm font-medium text-blue-600 hover:underline">
          התנתקות
        </button>
      </form>
    </main>
  );
}
