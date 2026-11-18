import { createClient } from "./supabase/client";

const MAX_FILE_MB = 5;

/**
 * Безопасное имя файла для Supabase Storage (S3 не любит кириллицу, пробелы и спецсимволы в ключах).
 * Оригинальное имя сохраняется отдельно в колонке file_names для отображения пользователю.
 */
function toSafeStorageName(originalName: string, index: number): string {
  const dotIdx = originalName.lastIndexOf(".");
  const rawExt = dotIdx > 0 ? originalName.slice(dotIdx).toLowerCase() : "";
  const safeExt = rawExt.replace(/[^.a-z0-9]/g, "") || ".bin";
  const asciiBase = (dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
  return `doc_${index + 1}_${Date.now()}${asciiBase ? `_${asciiBase}` : ""}${safeExt}`;
}

/** Загрузка документов заявки в приватный bucket documents/<uid>/<appId>/ */
export async function uploadDocuments(
  userId: string,
  appId: string,
  files: File[]
): Promise<{ names: string[]; paths: string[] } | { error: string }> {
  const supabase = createClient();
  const names: string[] = [];
  const paths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return { error: `Файл «${file.name}» больше ${MAX_FILE_MB} МБ` };
    }
    const safeName = toSafeStorageName(file.name, i);
    const path = `${userId}/${appId}/${safeName}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
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
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
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
