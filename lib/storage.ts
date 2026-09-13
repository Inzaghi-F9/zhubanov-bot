import { createClient } from "./supabase/client";

const MAX_FILE_MB = 10;

/** Загрузка документов заявки в приватный bucket documents/<uid>/ */
export async function uploadDocuments(
  userId: string,
  appId: string,
  files: File[]
): Promise<{ names: string[]; paths: string[] } | { error: string }> {
  const supabase = createClient();
  const names: string[] = [];
  const paths: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return { error: `Файл «${file.name}» больше ${MAX_FILE_MB} МБ` };
    }
    const path = `${userId}/${appId}/${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, {
      upsert: true,
    });
    if (error) return { error: `Ошибка загрузки «${file.name}»: ${error.message}` };
    names.push(file.name);
    paths.push(path);
  }

  return { names, paths };
}

/** Подписанная ссылка на скачивание документа (RLS проверит права) */
export async function getDocumentUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

/** Аватарка в публичный bucket avatars/<uid>/avatar */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const path = `${userId}/avatar`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // ?t= ломает кэш, чтобы новый аватар отобразился сразу
  return `${data.publicUrl}?t=${Date.now()}`;
}