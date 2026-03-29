import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("login", login)
      .eq("password", password)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true, role: data.role });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}