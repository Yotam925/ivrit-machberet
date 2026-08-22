"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  learner: "/learner/dashboard",
  commander: "/commander/dashboard",
};

function failWith(message: string, mode: "signin" | "signup"): never {
  redirect(`/login?mode=${mode}&error=${encodeURIComponent(message)}`);
}

function translateSignUpError(message: string): string {
  if (message.includes("already registered")) return "כתובת האימייל הזו כבר רשומה במערכת";
  if (message.toLowerCase().includes("password")) return "הסיסמה חייבת להכיל לפחות 6 תווים";
  if (message.toLowerCase().includes("email")) return "כתובת האימייל אינה תקינה";
  return "ההרשמה נכשלה. נסה/י שוב";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    failWith("נא למלא אימייל וסיסמה", "signin");
    return;
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    failWith("אימייל או סיסמה שגויים", "signin");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role as UserRole | undefined;

  if (!role) {
    failWith("לא נמצא פרופיל משתמש. נסה/י להירשם מחדש או פני/ה לתמיכה", "signin");
    return;
  }

  redirect(DASHBOARD_BY_ROLE[role]);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const nativeLanguage = String(formData.get("native_language") ?? "").trim();
  const roleValue = formData.get("role");
  const role: UserRole | null =
    roleValue === "learner" || roleValue === "commander" ? roleValue : null;
  const commanderId = String(formData.get("commander_id") ?? "").trim();
  const commanderInvite = String(formData.get("commander_invite") ?? "").trim();

  if (!email || !password || !fullName || !role) {
    failWith("נא למלא את כל השדות הנדרשים ולבחור סוג משתמש", "signup");
    return;
  }

  if (role === "learner" && !commanderId) {
    failWith("נא לבחור מפקד/ת אישי/ת", "signup");
    return;
  }

  if (role === "commander" && !commanderInvite) {
    failWith("הרשמה כמפקד/ת דורשת קוד הזמנה", "signup");
    return;
  }

  const supabase = createClient();
  // NOTE: the role is decided by the database trigger, not here — it grants
  // 'commander' only against a valid invite code. Anything sent from the
  // client is a request, never a decision.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        native_language: nativeLanguage || null,
        commander_id: role === "learner" ? commanderId : null,
        commander_invite: role === "commander" ? commanderInvite : null,
      },
    },
  });

  if (error) {
    failWith(translateSignUpError(error.message), "signup");
    return;
  }

  if (!data.session) {
    redirect(
      `/login?mode=signin&message=${encodeURIComponent(
        "נרשמת בהצלחה! בדוק/י את תיבת המייל שלך כדי לאשר את החשבון לפני ההתחברות",
      )}`,
    );
  }

  // the trigger, not the form, decided the role — read back what it granted so
  // a rejected invite code lands the user in the right place
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user!.id)
    .single();

  const grantedRole = (profile?.role as UserRole | undefined) ?? "learner";

  if (role === "commander" && grantedRole !== "commander") {
    failWith("קוד ההזמנה אינו תקין. החשבון נוצר כחשבון חייל", "signup");
    return;
  }

  redirect(DASHBOARD_BY_ROLE[grantedRole]);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
