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
  Users,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { STATUS, ADMIN_STATUSES, STATUS_FLOW, type DbStatus } from "@/lib/statuses";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { getDocumentUrl } from "@/lib/storage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import { FACULTIES, SEMESTERS, type Application, type Profile, type Role } from "@/lib/types";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

type AdminTab = "applications" | "users";

export default function AdminDashboard() {
  const supabase = createClient();

  const [tab, setTab] = useState<AdminTab>("applications");
  const [apps, setApps] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("все");
  const [semesterFilter, setSemesterFilter] = useState("все");
  const [facultyFilter, setFacultyFilter] = useState("все");
  const [showAllStages, setShowAllStages] = useState(false);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadApps();
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllStages]);

  const loadApps = async () => {
    setLoading(true);
    let query = supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!showAllStages) {
      query = query.in("status", ADMIN_STATUSES);
    }

    const { data } = await query;
    if (data) setApps(data as Application[]);
    setLoading(false);
  };

  const loadProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProfiles(data as Profile[]);
  };

  const updateUserRoleOrFaculty = async (
    userId: string,
    newRole: Role,
    newFaculty: string | null
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, faculty: newFaculty })
      .eq("id", userId);

    if (error) {
      toast.error(
        "Ошибка обновления роли: " +
          error.message +
          " (выполните обновлённый migration.sql в Supabase)"
      );
      return;
    }

    toast.success("Права доступа пользователя обновлены ✅");
    loadProfiles();
  };

  const update = async (id: string, status: DbStatus, comment: string = "") => {
    const app = apps.find((a) => a.id === id);
    const { error } = await supabase
      .from("applications")
      .update({ status, dept_comment: comment })
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
      toast.success("Статус обновлён, письмо отправлено");
    }
    setCommentId(null);
    setText("");
    loadApps();
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

  // Фильтрация по потоку, факультету и поиску
  const searched = apps.filter((a) => {
    if (semesterFilter !== "все" && (a.semester || "") !== semesterFilter) return false;
    if (facultyFilter !== "все" && (a.student_faculty || "") !== facultyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = [
        a.student_name,
        a.university_name,
        a.student_email,
        a.student_group ?? "",
      ].some((v) => v.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const filtered = filter === "все" ? searched : searched.filter((a) => a.status === filter);

  // Выгрузка в CSV (открывается в Excel)
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
      "Комментарий департамента",
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
        a.dept_comment,
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
    link.download = `arsu_mobility_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Отчёт выгружен (Excel CSV)");
  };

  // Статистика для графиков
  const pieData = [
    { name: "Принято", value: searched.filter((a) => a.status === STATUS.ACCEPTED).length },
    {
      name: "В процессе",
      value: searched.filter(
        (a) =>
          (
            [STATUS.ACCEPTED, STATUS.REJECTED, STATUS.FACULTY_REJECTED] as string[]
          ).includes(a.status) === false
      ).length,
    },
    {
      name: "Отклонено",
      value: searched.filter(
        (a) => a.status === STATUS.REJECTED || a.status === STATUS.FACULTY_REJECTED
      ).length,
    },
  ].filter((d) => d.value > 0);

  const barData = Object.entries(
    searched.reduce((acc: Record<string, number>, app) => {
      if (app.university_name) {
        const key =
          app.university_name.length > 18
            ? app.university_name.slice(0, 18) + "…"
            : app.university_name;
        acc[key] = (acc[key] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const stages = STATUS_FLOW.map((s) => ({
    stage: s,
    count: searched.filter((a) => a.status === s).length,
  }));

  const filteredProfiles = userSearch.trim()
    ? profiles.filter((p) =>
        [p.name, p.email, p.faculty ?? "", p.group_name ?? ""].some((v) =>
          v.toLowerCase().includes(userSearch.toLowerCase())
        )
      )
    : profiles;

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-800 to-indigo-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={22} />
            <div>
              <div className="text-sm font-bold">ARSU Admin</div>
              <div className="text-[11px] text-blue-200">
                Департамент академической мобильности
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("applications")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "applications" ? "bg-white text-indigo-700 shadow" : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <ClipboardList size={13} /> Заявки ({apps.length})
            </button>
            <button
              onClick={() => setTab("users")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "users" ? "bg-white text-indigo-700 shadow" : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <Users size={13} /> Преподаватели и Роли ({profiles.length})
            </button>
            <button
              onClick={exportCsv}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
              title="Выгрузить заявки в Excel (CSV)"
            >
              <Download size={13} /> Excel (CSV)
            </button>
            <button
              onClick={() => {
                loadApps();
                loadProfiles();
              }}
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

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "users" ? (
          /* Управление доступом преподавателей разных факультетов */
          <div className="space-y-4">
            <div className="card rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    Доступ для преподавателей и сотрудников факультетов
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Чтобы дать доступ проверяющему преподавателю из любого факультета: попросите его
                    зарегистрироваться на странице <code>/auth</code>, затем найдите его ниже, выберите
                    роль <strong>«Факультет (проверяющий)»</strong> и укажите его факультет. При входе
                    он автоматически попадёт в кабинет <code>/faculty</code> с фильтром по своему факультету.
                  </p>
                </div>
              </div>

              <div className="relative mt-4">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Поиск пользователя по ФИО, email или факультету…"
                  className="card w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredProfiles.map((p) => (
                <div
                  key={p.id}
                  className="card flex flex-col justify-between gap-3 rounded-2xl p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{p.name || "Без имени"}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          p.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : p.role === "faculty"
                              ? "bg-teal-100 text-teal-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.role === "admin"
                          ? "Администратор (Департамент)"
                          : p.role === "faculty"
                            ? "Факультет (Проверяющий)"
                            : "Студент"}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      📧 {p.email}
                      {p.group_name ? ` · Группа: ${p.group_name}` : ""}
                      {p.phone ? ` · 📞 ${p.phone}` : ""}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={p.role}
                      onChange={(e) =>
                        updateUserRoleOrFaculty(p.id, e.target.value as Role, p.faculty ?? null)
                      }
                      className="card rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                    >
                      <option value="student">Студент</option>
                      <option value="faculty">Факультет (проверяющий)</option>
                      <option value="admin">Админ (департамент)</option>
                    </select>

                    <select
                      value={p.faculty ?? ""}
                      onChange={(e) =>
                        updateUserRoleOrFaculty(p.id, p.role, e.target.value || null)
                      }
                      className="card max-w-[240px] rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="">— Факультет не указан —</option>
                      {FACULTIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Поиск + Фильтры потока и факультета */}
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <div className="relative sm:col-span-2">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по ФИО, группе, вузу или email…"
                  className="card w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition"
                />
              </div>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="card w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 transition"
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
                className="card w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 transition"
              >
                <option value="все">Все факультеты</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Фильтры по статусам + переключатель видимости всех заявок */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {["все", ...ADMIN_STATUSES].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                      filter === f
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                        : "card hover:border-indigo-400"
                    }`}
                  >
                    {f === "все" ? `Все (${searched.length})` : f}
                  </button>
                ))}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={showAllStages}
                  onChange={(e) => setShowAllStages(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                Показывать также заявки на стадии факультета
              </label>
            </div>

            {/* Графики */}
            {pieData.length > 0 && (
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="card rounded-2xl p-4 shadow-sm">
                  <h3 className="mb-2 text-xs font-semibold text-slate-500">
                    Заявки по вузам (топ-5)
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={45}
                      />
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
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card h-28 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">
                {search || filter !== "все" || semesterFilter !== "все" || facultyFilter !== "все"
                  ? "Ничего не найдено 🔍"
                  : "Заявок пока нет 🎓"}
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
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">
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
                          {app.faculty_comment && (
                            <div>
                              💬 <strong>Комментарий факультета:</strong> {app.faculty_comment}
                            </div>
                          )}
                          {app.dept_comment && (
                            <div>
                              💬 <strong>Комментарий департамента:</strong> {app.dept_comment}
                            </div>
                          )}
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

                        {commentId === app.id ? (
                          <div className="mt-3 flex flex-col gap-2">
                            <input
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              placeholder="Причина (видна студенту в письме и кабинете)…"
                              className="card w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => update(app.id, STATUS.REJECTED, text)}
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
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                            <button
                              onClick={() => update(app.id, STATUS.DEPARTMENT_REVIEW)}
                              className="rounded-xl bg-indigo-500 py-2.5 text-xs font-semibold text-white hover:bg-indigo-600 transition"
                            >
                              🏛 На рассмотрение
                            </button>
                            <button
                              onClick={() => update(app.id, STATUS.TEST)}
                              className="rounded-xl bg-violet-500 py-2.5 text-xs font-semibold text-white hover:bg-violet-600 transition"
                            >
                              📝 Тестирование
                            </button>
                            <button
                              onClick={() => update(app.id, STATUS.INTERVIEW)}
                              className="rounded-xl bg-blue-500 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 transition"
                            >
                              🎤 Интервью
                            </button>
                            <button
                              onClick={() => update(app.id, STATUS.ACCEPTED)}
                              className="rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                            >
                              ✓ Принять
                            </button>
                            <button
                              onClick={() => setCommentId(app.id)}
                              className="rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
                            >
                              ✗ Ошибка / возврат
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
