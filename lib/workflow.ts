import toast from "react-hot-toast";
import { createClient } from "./supabase/client";

/** Отправить email-уведомление по текущему статусу заявки. Возвращает текст ошибки или null */
export async function notifyApplication(applicationId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    if (res.ok) return null;
    const d = await res.json().catch(() => ({}));
    return d?.error ?? `Ошибка ${res.status}`;
  } catch {
    return "Сеть недоступна";
  }
}

/** Обновить заявку (статус + детали) и уведомить студента по почте */
export async function applyUpdate(id: string, patch: Record<string, unknown>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("applications").update(patch).eq("id", id);
  if (error) {
    toast.error("Ошибка: " + error.message);
    return false;
  }
  const mailError = await notifyApplication(id);
  if (mailError) {
    toast("Статус обновлён, но письмо не отправлено: " + mailError, { icon: "⚠️", duration: 7000 });
  } else {
    toast.success("Статус обновлён, студент уведомлён по email ✉️");
  }
  return true;
}
