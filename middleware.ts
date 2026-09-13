import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return (await updateSession(request)).response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/faculty/:path*", "/admin/:path*", "/auth/:path*"],
};