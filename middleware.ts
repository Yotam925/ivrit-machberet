import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/lib/supabase/types";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  learner: "/learner/dashboard",
  commander: "/commander/dashboard",
};

export async function middleware(request: NextRequest) {
  // Without real Supabase credentials there is no backend to check auth
  // against — let requests through so the page itself can show a clear
  // "connect Supabase" message instead of every route 500ing.
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/learner") || pathname.startsWith("/commander");

  if (!user) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  if (isProtected || pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as UserRole | undefined;

    if (pathname === "/login") {
      if (role) {
        return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role], request.url));
      }
      return response;
    }

    if (!role) {
      // No resolvable profile/role: fail closed rather than letting an
      // authenticated-but-roleless user through to a role-gated route.
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const ownsPath = pathname.startsWith("/learner") ? role === "learner" : role === "commander";

    if (!ownsPath) {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[role], request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/learner/:path*", "/commander/:path*", "/login"],
};
