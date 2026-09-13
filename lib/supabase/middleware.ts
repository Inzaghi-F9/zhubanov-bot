import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROUTE_ROLES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/faculty": ["faculty"],
  "/dashboard": ["student", "faculty", "admin"],
};

const homeFor = (role: string | undefined) =>
  role === "admin" ? "/admin" : role === "faculty" ? "/faculty" : "/dashboard";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const matchedRoute = Object.keys(ROUTE_ROLES).find((prefix) => path.startsWith(prefix));

  if (!user) {
    if (matchedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.search = `?next=${encodeURIComponent(path)}`;
      return { response: NextResponse.redirect(url), role: undefined as string | undefined };
    }
    return { response, role: undefined as string | undefined };
  }

  // Роль берём из profiles (RLS разрешает читать свой профиль)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;

  if (matchedRoute && (!role || !ROUTE_ROLES[matchedRoute].includes(role))) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(role);
    url.search = "";
    return { response: NextResponse.redirect(url), role };
  }

  // Уже вошедших на /auth отправляем в их кабинет
  if (path.startsWith("/auth") && !path.startsWith("/auth/reset")) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(role);
    url.search = "";
    return { response: NextResponse.redirect(url), role };
  }

  return { response, role };
}