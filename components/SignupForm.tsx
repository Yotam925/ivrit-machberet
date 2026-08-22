"use client";

import { useState } from "react";
import { signUp } from "@/app/(auth)/login/actions";
import type { CommanderOption, UserRole } from "@/lib/supabase/types";

export function SignupForm({ commanders }: { commanders: CommanderOption[] }) {
  const [role, setRole] = useState<UserRole>("learner");

  return (
    <form action={signUp} className="flex flex-col gap-4">
      <Field label="שם מלא" name="full_name" type="text" required />
      <Field label="אימייל" name="email" type="email" required />
      <Field label="סיסמה" name="password" type="password" required minLength={6} />
      <Field label="שפת אם (לא חובה)" name="native_language" type="text" />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">סוג משתמש</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="learner"
              checked={role === "learner"}
              onChange={() => setRole("learner")}
            />
            חניך/ה
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="commander"
              checked={role === "commander"}
              onChange={() => setRole("commander")}
            />
            מפקד/ת · מדריך/ה
          </label>
        </div>
      </div>

      {role === "learner" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">מפקד/ת אישי/ת</span>
          {commanders.length === 0 ? (
            <p className="text-sm text-gray-500">
              עדיין אין מפקדים רשומים במערכת. יש לבקש מהמפקד/ת שלך להירשם קודם.
            </p>
          ) : (
            <select
              name="commander_id"
              required
              defaultValue=""
              className="rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                בחר/י מפקד/ת
              </option>
              {commanders.map((commander) => (
                <option key={commander.id} value={commander.id}>
                  {commander.full_name}
                </option>
              ))}
            </select>
          )}
        </label>
      )}

      <SubmitButton>הרשמה</SubmitButton>
    </form>
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
