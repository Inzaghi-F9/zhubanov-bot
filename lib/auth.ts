import { createClient } from "./supabase/client";
import type { Profile } from "./types";

/** Профиль текущего пользователя (или null, если не вошёл) */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

const homeFor = (role: string) =>
  role === "admin" ? "/admin" : role === "faculty" ? "/faculty" : "/dashboard";

export { homeFor };

/** Выход: чистим сессию на сервере, cookie обновит middleware */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/auth";
}