export type UserRole = "learner" | "commander";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  native_language: string | null;
  created_at: string;
};
