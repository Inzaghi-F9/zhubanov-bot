"use client";

import { useState, useEffect } from "react";
import {
  GraduationCap,
  LogOut,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, signOut } from "@/lib/auth";
import { STATUS, FACULTY_STATUSES, type DbStatus } from "@/lib/statuses";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { getDocumentUrl } from "@/lib/storage";
import toast from "react-hot-toast";
import { FACULTIES, SEMESTERS, type Application, type Profile } from "@/lib/types";

const FILTERS = [
  "все",
  STATUS.FACULTY_REVIEW,
  STATUS.FACULTY_RECOMMENDED,
  STATUS.FACULTY_REJECTED,
  STATUS.DEPARTMENT_REVIEW,
];

export default function FacultyDashboard() {
  const supabase = createClient();

  const [apps, setApps] = useState<Application[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [filter, setFilter] = useState("все");
  const [semesterFilter, setSemesterFilter] = useState("все");
  const [facultyFilter, setFacultyFilter] = useState("все");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const prof = await getProfile();
      if (prof) {
        setMyProfile(prof);
        // Если за преподавателем закреплён факультет — сразу фильтруем по его факультету!
        if (prof.faculty) setFacultyFilter(prof.faculty);
      }
      await loadApps();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = async () => {
    setLoading(true);
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
    if (error) {
      toast.error("Ошибка обновления");
      return;
    }

    let emailError = "";
    if (app) {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail: app.student_email,
          studentName: app.student_name,
          status,
          comment,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        emailError = d?.error || "Письмо не отправлено";
      }
    }
    if (emailError) {
      toast.success("Статус обновлён (но письмо не ушло: " + emailError + ")");
    } else {
      toast.success(
        status === STATUS.FACULTY_RECOMMENDED
          ? "Рекомендовано! Письмо отправлено"
          : "Отклонено. Письмо отправлено"
      );
    }
    setCommentId(null);
    setText("");
    loadApps();
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

  // Фильтрация по потоку, факультету и поиску
  const baseFiltered = apps.filter((a) => {
    if (semesterFilter !== "все" && (a.semester || "") !== semesterFilter) return false;
    if (facultyFilter !== "все" && (a.student_faculty || "") !== facultyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = [a.student_name, a.university_name, a.student_email, a.student_group ?? ""].some(
        (v) => v.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    return true;
  });

  const filtered =
    filter === "все" ? baseFiltered : baseFiltered.filter((a) => a.status === filter);
  const counts = (s: string) => baseFiltered.filter((a) => a.status === s).length;

  // Выгрузка отфильтрованного списка в CSV (Excel)
  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("Нет заявок для выгрузки");
      return;
    }
    const headers = [
      "ФИО студента",
      "Email",
      "Телефон",
      "Факультет",
      "Группа",
      "GPA",
      "Поток (семестр)",
      "Принимающий вуз",
      "Цель",
      "Статус",
      "Комментарий факультета",
      "Дата подачи",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((a) =>
      [
        a.student_name,
        a.student_email,
        a.student_phone ?? "",
        a.student_faculty ?? "",
        a.student_group ?? "",
        a.student_gpa ?? "",
        a.semester ?? "",
        a.university_name,
        a.purpose,
        a.status,
        a.faculty_comment,
        new Date(a.created_at).toLocaleDateString("ru-RU"),
      ]
        .map(esc)
        .join(";")
    );
    const csv = "\uFEFF" + [headers.map(esc).join(";"), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `arsu_faculty_applications_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Таблица выгружена (открывается в Excel)");
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={22} />
            <div>
              <div className="text-sm font-bold">ARSU Факультет</div>
              <div className="text-[11px] text-teal-200">
                {myProfile?.faculty ? myProfile.faculty : "Проверка заявок на мобильность"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
              title="Скачать список в Excel (CSV)"
            >
              <Download size={13} /> Excel (CSV)
            </button>
            <button
              onClick={loadApps}
              aria-label="Обновить"
              className="rounded-lg p-2 transition hover:bg-white/10"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={signOut}
              aria-label="Выйти"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs transition hover:bg-white/10"
            >
              <LogOut size={13} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Поиск + фильтр потока и факультета */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ФИО, группе, вузу…"
              className="card w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 transition"
            />
          </div>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="card w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 transition"
          >
            <option value="все">Все потоки (семестры)</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="card w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 transition"
          >
            <option value="все">Все факультеты</option>
            {FACULTIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтры по статусу */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                  : "card hover:border-teal-400"
              }`}
            >
              {f === "все" ? `Все (${baseFiltered.length})` : `${f} (${counts(f)})`}
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
                <button
                  onClick={() => showFiles(app)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{app.student_name}</span>
                      {app.student_group && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {app.student_group}
                        </span>
                      )}
                      {app.student_gpa && (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          GPA {app.student_gpa}
                        </span>
                      )}
                      {app.semester && (
                        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                          {app.semester}
                        </span>
                      )}
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      🏫 {app.university_name} · 📅 Подана{" "}
                      {new Date(app.created_at).toLocaleDateString("ru-RU")}
                      {app.student_faculty && <> · 🏛 {app.student_faculty}</>}
                      {app.file_paths.length > 0 && <> · 📎 {app.file_paths.length}</>}
                    </div>
                  </div>
                  {expanded === app.id ? (
                    <ChevronUp size={18} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400" />
                  )}
                </button>

                {expanded === app.id && (
                  <div className="border-t border-[color:var(--border)] p-4">
                    <StatusTimeline status={app.status} />

                    <div className="card mt-3 space-y-1.5 rounded-xl p-3 text-sm">
                      <div>
                        🎯 <strong>Цель:</strong> {app.purpose}
                      </div>
                      <div>
                        🏫 <strong>Университет:</strong> {app.university_name}
                      </div>
                      {app.student_faculty && (
                        <div>
                          🏛 <strong>Факультет:</strong> {app.student_faculty}
                          {app.student_group ? ` (${app.student_group})` : ""}
                        </div>
                      )}
                      {app.student_gpa && (
                        <div>
                          📊 <strong>GPA:</strong> {app.student_gpa}
                        </div>
                      )}
                      <div>
                        📧 <strong>Email:</strong> {app.student_email}
                        {app.student_phone ? ` · 📞 ${app.student_phone}` : ""}
                      </div>
                    </div>

                    {app.file_paths.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {app.file_paths.map((path, i) => (
                          <a
                            key={path}
                            href={urls[path] || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700 transition ${
                              urls[path] ? "hover:bg-blue-100" : "opacity-50"
                            }`}
                          >
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
                        <input
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Причина отклонения…"
                          className="card w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => update(app.id, STATUS.FACULTY_REJECTED, text)}
                            className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition"
                          >
                            Отправить
                          </button>
                          <button
                            onClick={() => setCommentId(null)}
                            className="flex-1 rounded-xl bg-slate-200 py-2.5 text-xs text-slate-600 transition hover:bg-slate-300"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => update(app.id, STATUS.FACULTY_RECOMMENDED)}
                          className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                        >
                          ✓ Рекомендовать
                        </button>
                        <button
                          onClick={() => setCommentId(app.id)}
                          className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600"
                        >
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
