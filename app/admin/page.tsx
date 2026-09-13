"use client";

import { useState, useEffect } from "react";
import { GraduationCap, LogOut, RefreshCw, ChevronDown, ChevronUp, FileText, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { STATUS, ADMIN_STATUSES, STATUS_FLOW, type DbStatus } from "@/lib/statuses";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { getDocumentUrl } from "@/lib/storage";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import toast from "react-hot-toast";
import type { Application } from "@/lib/types";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  const supabase = createClient();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("все");
  const [search, setSearch] = useState("");
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
    // RLS: admin видит все заявки после факультета
    const { data } = await supabase
      .from("applications")
      .select("*")
      .in("status", ADMIN_STATUSES)
      .order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setLoading(false);
  };

  const update = async (id: string, status: DbStatus, comment: string = "") => {
    const app = apps.find((a) => a.id === id);
    const { error } = await supabase
      .from("applications")
      .update({ status, dept_comment: comment })
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
    toast.success("Статус обновлён, письмо отправлено");
    setCommentId(null); setText(""); loadApps();
  };

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

  // Поиск по имени, вузу или email
  const searched = search.trim()
    ? apps.filter((a) =>
        [a.student_name, a.university_name, a.student_email].some((v) =>
          v.toLowerCase().includes(search.toLowerCase())
        )
      )
    : apps;
  const filtered = filter === "все" ? searched : searched.filter((a) => a.status === filter);

  // Статистика для графиков
  const pieData = [
    { name: "Принято", value: searched.filter((a) => a.status === STATUS.ACCEPTED).length },
    { name: "В процессе", value: searched.filter((a) => ([STATUS.ACCEPTED, STATUS.REJECTED] as string[]).includes(a.status) === false).length },
    { name: "Отклонено", value: searched.filter((a) => a.status === STATUS.REJECTED).length },
  ].filter((d) => d.value > 0);

  const barData = Object.entries(
    searched.reduce((acc: Record<string, number>, app) => {
      if (app.university_name) {
        const key = app.university_name.length > 18 ? app.university_name.slice(0, 18) + "…" : app.university_name;
        acc[key] = (acc[key] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const stages = STATUS_FLOW.map((s) => ({ stage: s, count: searched.filter((a) => a.status === s).length }));

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-800 to-indigo-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={22} />
            <div>
              <div className="text-sm font-bold">ARSU Admin</div>
              <div className="text-[11px] text-blue-200">Департамент академической мобильности</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadApps} aria-label="Обновить" className="rounded-lg p-2 transition hover:bg-white/10">
              <RefreshCw size={16} />
            </button>
            <button onClick={signOut} aria-label="Выйти"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs transition hover:bg-white/10">
              <LogOut size={13} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Поиск */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, вузу или email…"
            className="card w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition" />
        </div>

        {/* Фильтры */}
        <div className="mb-5 flex flex-wrap gap-2">
          {["все", ...ADMIN_STATUSES].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25" : "card hover:border-indigo-400"
              }`}>
              {f === "все" ? `Все (${apps.length})` : f}
            </button>
          ))}
        </div>

        {/* Графики */}
        {pieData.length > 0 && (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="card rounded-2xl p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold text-slate-500">Заявки по вузам (топ-5)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip wrapperClassName="card !rounded-xl !text-xs" />
                  <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card rounded-2xl p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold text-slate-500">Итоги заявок</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip wrapperClassName="card !rounded-xl !text-xs" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Стадии конвейера */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stages.map(({ stage, count }) => (
            <div key={stage} className="card rounded-2xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">{count}</div>
              <div className="mt-1 text-[10px] leading-tight text-slate-500">{stage}</div>
            </div>
          ))}
        </div>

        {/* Список заявок */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">
            {search || filter !== "все" ? "Ничего не найдено 🔍" : "Заявок пока нет 🎓"}
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
                      {app.faculty_comment && <div>💬 <strong>Комментарий факультета:</strong> {app.faculty_comment}</div>}
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

                    {commentId === app.id ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <input value={text} onChange={(e) => setText(e.target.value)}
                          placeholder="Причина (видна студенту в письме)…"
                          className="card w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                        <div className="flex gap-2">
                          <button onClick={() => update(app.id, STATUS.REJECTED, text)}
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
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <button onClick={() => update(app.id, STATUS.ACCEPTED)}
                          className="rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 transition">
                          ✓ Принять
                        </button>
                        <button onClick={() => update(app.id, STATUS.TEST)}
                          className="rounded-xl bg-violet-500 py-2.5 text-xs font-semibold text-white hover:bg-violet-600 transition">
                          📝 Тестирование
                        </button>
                        <button onClick={() => update(app.id, STATUS.INTERVIEW)}
                          className="rounded-xl bg-blue-500 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 transition">
                          🎤 Интервью
                        </button>
                        <button onClick={() => setCommentId(app.id)}
                          className="rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white hover:bg-amber-600 transition">
                          ✗ Ошибка
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