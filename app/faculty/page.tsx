"use client";

import { useState, useEffect } from "react";
import { GraduationCap, LogOut, RefreshCw, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { STATUS, FACULTY_STATUSES, type DbStatus } from "@/lib/statuses";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { getDocumentUrl } from "@/lib/storage";
import toast from "react-hot-toast";
import type { Application } from "@/lib/types";

const FILTERS = ["все", STATUS.FACULTY_REVIEW, STATUS.FACULTY_RECOMMENDED, STATUS.FACULTY_REJECTED, STATUS.DEPARTMENT_REVIEW];

export default function FacultyDashboard() {
  const supabase = createClient();

  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState("все");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = async () => {
    setLoading(true);
    // RLS сам отфильтрует: faculty видит все заявки
    const { data } = await supabase
      .from("applications")
      .select("*")
      .in("status", FACULTY_STATUSES)
      .order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setLoading(false);
  };

  const update = async (id: string, status: DbStatus, comment: string = "") => {
    const app = apps.find((a) => a.id === id);
    const { error } = await supabase
      .from("applications")
      .update({ status, faculty_comment: comment })
      .eq("id", id);
    if (error) { toast.error("Ошибка обновления"); return; }

    if (app) {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail: app.student_email,
          studentName: app.student_name,
          status,
          comment,
        }),
      });
    }
    toast.success(status === STATUS.FACULTY_RECOMMENDED ? "Рекомендовано! Письмо отправлено" : "Отклонено. Письмо отправлено");
    setCommentId(null); setText(""); loadApps();
  };

  // Подписанные ссылки на документы открываем при разворачивании карточки
  const showFiles = async (app: Application) => {
    const willExpand = expanded !== app.id;
    setExpanded(willExpand ? app.id : null);
    if (!willExpand || app.file_paths.length === 0) return;

    const nextUrls = { ...urls };
    for (const path of app.file_paths) {
      if (!nextUrls[path]) nextUrls[path] = (await getDocumentUrl(path)) ?? "";
    }
    setUrls(nextUrls);
  };

  const filtered = filter === "все" ? apps : apps.filter((a) => a.status === filter);
  const counts = (s: string) => apps.filter((a) => a.status === s).length;

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={22} />
            <div>
              <div className="text-sm font-bold">ARSU Факультет</div>
              <div className="text-[11px] text-teal-200">Проверка заявок на мобильность</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadApps} aria-label="Обновить"
              className="rounded-lg p-2 transition hover:bg-white/10">
              <RefreshCw size={16} />
            </button>
            <button onClick={signOut} aria-label="Выйти"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs transition hover:bg-white/10">
              <LogOut size={13} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Фильтры */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f ? "bg-teal-600 text-white shadow-md shadow-teal-600/25" : "card hover:border-teal-400"
              }`}>
              {f === "все" ? `Все (${apps.length})` : `${f} (${counts(f)})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-28 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">
            Заявок пока нет 🎓
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <article key={app.id} className="card overflow-hidden rounded-2xl shadow-sm">
                <button onClick={() => showFiles(app)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{app.student_name}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      🏫 {app.university_name} · 📅 {new Date(app.date_from).toLocaleDateString("ru-RU")} — {new Date(app.date_to).toLocaleDateString("ru-RU")}
                      {app.file_paths.length > 0 && <> · 📎 {app.file_paths.length}</>}
                    </div>
                  </div>
                  {expanded === app.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {expanded === app.id && (
                  <div className="border-t border-[color:var(--border)] p-4">
                    <StatusTimeline status={app.status} />

                    <div className="card mt-3 space-y-1.5 rounded-xl p-3 text-sm">
                      <div>🎯 <strong>Цель:</strong> {app.purpose}</div>
                      <div>🏫 <strong>Университет:</strong> {app.university_name}</div>
                      <div>📧 <strong>Email:</strong> {app.student_email}</div>
                    </div>

                    {app.file_paths.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {app.file_paths.map((path, i) => (
                          <a key={path} href={urls[path] || "#"} target="_blank" rel="noreferrer"
                            className={`inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700 transition ${urls[path] ? "hover:bg-blue-100" : "opacity-50"}`}>
                            <FileText size={12} /> {app.file_names[i] ?? path.split("/").pop()}
                          </a>
                        ))}
                      </div>
                    )}

                    {app.faculty_comment && (
                      <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                        💬 Предыдущий комментарий: {app.faculty_comment}
                      </div>
                    )}

                    {commentId === app.id ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <input value={text} onChange={(e) => setText(e.target.value)}
                          placeholder="Причина отклонения…"
                          className="card w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                        <div className="flex gap-2">
                          <button onClick={() => update(app.id, STATUS.FACULTY_REJECTED, text)}
                            className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition">
                            Отправить
                          </button>
                          <button onClick={() => setCommentId(null)}
                            className="flex-1 rounded-xl bg-slate-200 py-2.5 text-xs text-slate-600 transition hover:bg-slate-300">
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => update(app.id, STATUS.FACULTY_RECOMMENDED)}
                          className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600">
                          ✓ Рекомендовать
                        </button>
                        <button onClick={() => setCommentId(app.id)}
                          className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600">
                          ✗ Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}