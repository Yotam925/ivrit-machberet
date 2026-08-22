import { signIn } from "./actions";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { SignupForm } from "@/components/SignupForm";
import { createClient } from "@/lib/supabase/server";
import type { CommanderOption } from "@/lib/supabase/types";

type SearchParams = {
  mode?: string;
  error?: string;
  message?: string;
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  const mode = searchParams.mode === "signup" ? "signup" : "signin";

  let commanders: CommanderOption[] = [];
  if (mode === "signup") {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "commander")
      .order("full_name", { ascending: true });
    commanders = data ?? [];
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold">עברית מחברת</h1>
        <p className="mt-1 text-gray-600">{mode === "signin" ? "התחברות" : "הרשמה"}</p>
      </div>

      {searchParams.message && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {searchParams.message}
        </p>
      )}
      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchParams.error}
        </p>
      )}

      {mode === "signin" ? (
        <form action={signIn} className="flex flex-col gap-4">
          <Field label="אימייל" name="email" type="email" required />
          <Field label="סיסמה" name="password" type="password" required minLength={6} />
          <SubmitButton>התחברות</SubmitButton>
        </form>
      ) : (
        <SignupForm commanders={commanders} />
      )}

      <p className="text-center text-sm text-gray-600">
        {mode === "signin" ? (
          <>
            אין לך חשבון?{" "}
            <a href="/login?mode=signup" className="font-medium text-blue-600 hover:underline">
              הרשמה
            </a>
          </>
        ) : (
          <>
            כבר יש לך חשבון?{" "}
            <a href="/login?mode=signin" className="font-medium text-blue-600 hover:underline">
              התחברות
            </a>
          </>
        )}
      </p>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
    >
      {children}
    </button>
  );
}
