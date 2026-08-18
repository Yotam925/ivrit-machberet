import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { LEVEL_LABELS_HE, type UserLevel } from "@/lib/supabase/types";

export default async function LearnerDashboardPage() {
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
    .select("full_name, level")
    .eq("id", user.id)
    .single();

  if (!profile?.level) {
    redirect("/learner/level-test");
  }

  const level = profile.level as UserLevel;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">
        ברוך הבא{profile?.full_name ? `, ${profile.full_name}` : ""}!
      </h1>
      <p className="rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
        רמה: {LEVEL_LABELS_HE[level]}
      </p>
      <p className="text-gray-600">אזור הלומד — בקרוב יתווסף כאן תוכן לימודי.</p>
      <form action={signOut}>
        <button type="submit" className="text-sm font-medium text-blue-600 hover:underline">
          התנתקות
        </button>
      </form>
    </main>
  );
}
