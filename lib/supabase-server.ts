import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Серверный клиент (для API routes и server components)
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        cookie: cookieStore
          .getAll()
          .map(({ name, value }) => `${name}=${value}`)
          .join(";"),
      },
    },
  });
};
