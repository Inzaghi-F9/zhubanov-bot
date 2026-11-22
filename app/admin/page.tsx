"use client";

import { useState, useEffect } from "react";
import {
  GraduationCap,
  LogOut,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Users,
  ClipboardList,
  ShieldCheck,
  Table,
  Award,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import {
  STATUS,
  GROUPS,
  GROUP_KEYS,
  inGroup,
  isRecommended,
  type GroupKey,
} from "@/lib/statuses";
import { applyUpdate } from "@/lib/workflow";
import { downloadCsv, FULL_HEADERS, fullRow } from "@/lib/export";
import { formatDate, universitiesText } from "@/lib/application";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ApplicationDetails } from "@/components/ApplicationDetails";
import { StudentsTable } from "@/components/StudentsTable";
import {
  FixForm,
  ReasonForm,
  EventForm,
  ResultForm,
  DecisionForm,
} from "@/components/ReviewForms";
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
import {
  FACULTIES,
  SEMESTERS,
  COURSES,
  STUDY_FORMS,
  PARTICIPATION,
  EDUCATION_LEVELS,
  type Application,
  type Profile,
  type Role,
} from "@/lib/types";

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

type AdminTab = "applications" | "recommended" | "table" | "users";
type DeptAction =
  | "fix"
  | "reject"
  | "invite_test"
  | "result_test"
  | "invite_interview"
  | "result_interview"
  | "decision"
  | null;

export default function AdminDashboard() {
  const supabase = createClient();

  const [tab, setTab] = useState<AdminTab>("applications");
  const [apps, setApps] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры по каждому показателю
  const [groupFilter, setGroupFilter] = useState<"all" | GroupKey>("all");
  const [semesterFilter, setSemesterFilter] = useState("все");
  const [facultyFilter, setFacultyFilter] = useState("все");
  const [courseFilter, setCourseFilter] = useState("все");
  const [studyFormFilter, setStudyFormFilter] = useState("все");
  const [participationFilter, setParticipationFilter] = useState("все");
  const [levelFilter, setLevelFilter] = useState("все");
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionFor, setActionFor] = useState<{ id: string; mode: DeptAction }>({
    id: "",
    mode: null,
  });

  useEffect(() => {
    loadApps();
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
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

  // Фильтрация по всем показателям
  const searched = apps.filter((a) => {
    if (semesterFilter !== "все" && (a.semester || "") !== semesterFilter) return false;
    if (facultyFilter !== "все" && (a.student_faculty || "") !== facultyFilter) return false;
    if (courseFilter !== "все" && String(a.course ?? "") !== courseFilter) return false;
    if (studyFormFilter !== "все" && (a.study_form || "") !== studyFormFilter) return false;
    if (participationFilter !== "все" && (a.participation || "") !== participationFilter)
      return false;
    if (levelFilter !== "все" && (a.education_level || "") !== levelFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = [
        a.student_name,
        a.university_name,
        a.student_email,
        a.student_group ?? "",
        a.specialty ?? "",
        universitiesText(a),
      ].some((v) => v.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const baseForTab =
    tab === "recommended" ? searched.filter((a) => isRecommended(a.status)) : searched;

  const filtered =
    groupFilter === "all"
      ? baseForTab
      : baseForTab.filter((a) => inGroup(a.status, groupFilter));

  // Статистика по факультетам (сколько студентов пришло из каждого факультета)
  const facultyStats = FACULTIES.map((f) => {
    const list = searched.filter((a) => a.student_faculty === f);
    const rec = list.filter((a) => isRecommended(a.status)).length;
    const acc = list.filter((a) => a.status === STATUS.ACCEPTED).length;
    return {
      faculty: f,
      shortName: f.replace("Факультет ", "Ф-т ").slice(0, 22),
      total: list.length,
      recommended: rec,
      accepted: acc,
    };
  });

  const uniqueStudentsCount = new Set(searched.map((a) => a.student_id)).size;

  // Выгрузка Excel-отчётов по любому показателю
  const handleReportExport = (kind: string) => {
    if (searched.length === 0) {
      toast.error("Нет данных для выгрузки");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);

    if (kind === "filtered") {
      downloadCsv(`arsu_report_filtered_${today}.csv`, FULL_HEADERS, filtered.map(fullRow));
    } else if (kind === "recommended") {
      const rec = searched.filter((a) => isRecommended(a.status));
      downloadCsv(`arsu_report_recommended_${today}.csv`, FULL_HEADERS, rec.map(fullRow));
    } else if (kind === "accepted") {
      const acc = searched.filter((a) => a.status === STATUS.ACCEPTED);
      downloadCsv(`arsu_report_accepted_${today}.csv`, FULL_HEADERS, acc.map(fullRow));
    } else if (kind === "by_faculty") {
      downloadCsv(
        `arsu_report_by_faculty_${today}.csv`,
        ["Факультет", "Всего заявок", "Рекомендовано факультетом", "Принято"],
        facultyStats.map((s) => [s.faculty, s.total, s.recommended, s.accepted])
      );
    } else if (kind === "by_course_form") {
      const rows = COURSES.flatMap((c) =>
        STUDY_FORMS.map((sf) => {
          const list = searched.filter((a) => String(a.course) === c && a.study_form === sf);
          return [`${c} курс`, sf, list.length];
        })
      );
      downloadCsv(
        `arsu_report_by_course_and_form_${today}.csv`,
        ["Курс", "Форма обучения", "Количество студентов"],
        rows
      );
    } else if (kind === "by_funding") {
      const map: Record<string, number> = {};
      searched.forEach((a) => {
        const k = a.funding_source || "Не указано";
        map[k] = (map[k] ?? 0) + 1;
      });
      downloadCsv(
        `arsu_report_by_funding_${today}.csv`,
        ["Источник финансирования", "Количество заявок"],
        Object.entries(map)
      );
    } else if (kind === "by_participation") {
      const map: Record<string, number> = {};
      searched.forEach((a) => {
        const k = a.participation || "Не указано";
        map[k] = (map[k] ?? 0) + 1;
      });
      downloadCsv(
        `arsu_report_by_participation_${today}.csv`,
        ["Кратность участия", "Количество заявок"],
        Object.entries(map)
      );
    }
    toast.success("Excel-отчёт (CSV) скачан 📊");
  };

  const pieData = [
    { name: "Принято", value: searched.filter((a) => a.status === STATUS.ACCEPTED).length },
    {
      name: "Рекомендованы / В процессе",
      value: searched.filter(
        (a) =>
          isRecommended(a.status) &&
          ![STATUS.ACCEPTED, STATUS.NOT_ACCEPTED, STATUS.DEPARTMENT_REJECTED].includes(
            a.status as never
          )
      ).length,
    },
    {
      name: "На проверке факультета",
      value: searched.filter((a) => !isRecommended(a.status)).length,
    },
    {
      name: "Отклонено / Не принято",
      value: searched.filter((a) => inGroup(a.status, "rejected")).length,
    },
  ].filter((d) => d.value > 0);

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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={22} />
            <div>
              <div className="text-sm font-bold">ARSU Департамент (Админ)</div>
              <div className="text-[11px] text-blue-200">
                Управление академической мобильностью по всем факультетам
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setTab("applications")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "applications"
                  ? "bg-white text-indigo-700 shadow"
                  : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <ClipboardList size={13} /> Все заявки ({apps.length})
            </button>
            <button
              onClick={() => setTab("recommended")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "recommended"
                  ? "bg-white text-indigo-700 shadow"
                  : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <Award size={13} /> Рекомендованные ({apps.filter((a) => isRecommended(a.status)).length})
            </button>
            <button
              onClick={() => setTab("table")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "table"
                  ? "bg-white text-indigo-700 shadow"
                  : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <Table size={13} /> Полный список студентов
            </button>
            <button
              onClick={() => setTab("users")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "users"
                  ? "bg-white text-indigo-700 shadow"
                  : "bg-white/15 hover:bg-white/25"
              }`}
            >
              <Users size={13} /> Координаторы и Роли ({profiles.length})
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

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === "users" ? (
          /* Управление доступом координаторов факультетов */
          <div className="space-y-4">
            <div className="card rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    Доступ для координаторов факультетов и сотрудников департамента
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Назначьте преподавателю роль <strong>«Факультет (координатор)»</strong> и выберите
                    его факультет — он будет видеть и проверять студентов своего факультета, а также
                    получать email-уведомления о новых заявках своего факультета.
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
                            ? "Факультет (Координатор)"
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
                      <option value="faculty">Факультет (координатор)</option>
                      <option value="admin">Админ (департамент)</option>
                    </select>

                    <select
                      value={p.faculty ?? ""}
                      onChange={(e) =>
                        updateUserRoleOrFaculty(p.id, p.role, e.target.value || null)
                      }
                      className="card max-w-[260px] rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="">— Все факультеты —</option>
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
            {/* Сводные показатели: всего подающих студентов, рекомендовано, принято + выгрузка Excel */}
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="card rounded-2xl p-4 shadow-sm">
                <div className="text-2xl font-extrabold text-blue-600">{searched.length}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Всего поданных заявок ({uniqueStudentsCount} студ.)
                </div>
              </div>
              <div className="card rounded-2xl p-4 shadow-sm">
                <div className="text-2xl font-extrabold text-teal-600">
                  {searched.filter((a) => isRecommended(a.status)).length}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Рекомендованы факультетами</div>
              </div>
              <div className="card rounded-2xl p-4 shadow-sm">
                <div className="text-2xl font-extrabold text-violet-600">
                  {searched.filter((a) => inGroup(a.status, "test") || inGroup(a.status, "interview")).length}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">На тестировании / интервью</div>
              </div>
              <div className="card rounded-2xl p-4 shadow-sm">
                <div className="text-2xl font-extrabold text-emerald-600">
                  {searched.filter((a) => a.status === STATUS.ACCEPTED).length}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Принято (итоговое решение)</div>
              </div>

              {/* Выгрузка отчётов в Excel по каждому показателю */}
              <div className="card flex flex-col justify-between rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <Download size={14} /> Скачать Excel-отчёт
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleReportExport(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border border-indigo-200 bg-indigo-50/70 px-2.5 py-2 text-xs font-medium text-indigo-800 outline-none"
                >
                  <option value="" disabled>
                    Выберите вид отчёта…
                  </option>
                  <option value="filtered">📋 Текущий список (по фильтрам)</option>
                  <option value="recommended">✅ Рекомендованные факультетами</option>
                  <option value="accepted">🎉 Принятые студенты (итог)</option>
                  <option value="by_faculty">🏛 Сводка по факультетам</option>
                  <option value="by_course_form">🎓 По курсам и форме обучения</option>
                  <option value="by_funding">💰 По источникам финансирования</option>
                  <option value="by_participation">🔄 По кратности участия</option>
                </select>
              </div>
            </div>

            {/* Распределение заявок по факультетам (кликабельные карточки факультетов) */}
            <div className="card mb-5 rounded-2xl p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  🏛 Заявки по факультетам (нажмите на факультет, чтобы открыть его список)
                </h3>
                {facultyFilter !== "все" && (
                  <button
                    onClick={() => setFacultyFilter("все")}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Показать все факультеты
                  </button>
                )}
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {facultyStats.map((fs) => {
                  const active = facultyFilter === fs.faculty;
                  return (
                    <button
                      key={fs.faculty}
                      onClick={() => setFacultyFilter(active ? "все" : fs.faculty)}
                      className={`card flex items-center justify-between rounded-xl p-3 text-left transition ${
                        active ? "border-indigo-500 bg-indigo-50/60" : "hover:border-indigo-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate text-xs font-semibold">{fs.faculty}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          Рекомендовано: <b>{fs.recommended}</b> · Принято: <b>{fs.accepted}</b>
                        </div>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
                        {fs.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Фильтры по курсу, форме обучения, участию, потоку, факультету и поиску */}
            <div className="mb-4 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
              <div className="relative sm:col-span-2">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск: ФИО, шифр спец., вуз, email…"
                  className="card w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="card rounded-xl px-2.5 py-2 text-xs outline-none"
              >
                <option value="все">Все потоки</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="card rounded-xl px-2.5 py-2 text-xs outline-none"
              >
                <option value="все">Все курсы</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c} курс
                  </option>
                ))}
              </select>
              <select
                value={studyFormFilter}
                onChange={(e) => setStudyFormFilter(e.target.value)}
                className="card rounded-xl px-2.5 py-2 text-xs outline-none"
              >
                <option value="все">Грант и Платное</option>
                {STUDY_FORMS.map((sf) => (
                  <option key={sf} value={sf}>
                    {sf}
                  </option>
                ))}
              </select>
              <select
                value={participationFilter}
                onChange={(e) => setParticipationFilter(e.target.value)}
                className="card rounded-xl px-2.5 py-2 text-xs outline-none"
              >
                <option value="все">Любое участие</option>
                {PARTICIPATION.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="card rounded-xl px-2.5 py-2 text-xs outline-none"
              >
                <option value="все">Бакалавр + Магистр</option>
                {EDUCATION_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Фильтры по этапам процесса */}
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setGroupFilter("all")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  groupFilter === "all"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                    : "card hover:border-indigo-400"
                }`}
              >
                Все ({baseForTab.length})
              </button>
              {GROUP_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setGroupFilter(k)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    groupFilter === k
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "card hover:border-indigo-400"
                  }`}
                >
                  {GROUPS[k].label} ({baseForTab.filter((a) => inGroup(a.status, k)).length})
                </button>
              ))}
            </div>

            {/* Графики */}
            {tab === "applications" && pieData.length > 0 && (
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="card rounded-2xl p-4 shadow-sm">
                  <h3 className="mb-2 text-xs font-semibold text-slate-500">
                    Заявки по факультетам
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={facultyStats.filter((f) => f.total > 0)}>
                      <XAxis
                        dataKey="shortName"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={45}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip wrapperClassName="card !rounded-xl !text-xs" />
                      <Bar dataKey="total" name="Заявок" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card rounded-2xl p-4 shadow-sm">
                  <h3 className="mb-2 text-xs font-semibold text-slate-500">Статусы заявок</h3>
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

            {/* Таблица или карточки */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card h-28 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : tab === "table" ? (
              <StudentsTable
                apps={filtered}
                onSelect={(app) => {
                  setTab("applications");
                  setExpanded(app.id);
                }}
              />
            ) : filtered.length === 0 ? (
              <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">
                Ничего не найдено 🔍
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((app) => {
                  const isOpen = expanded === app.id;
                  const currentMode = actionFor.id === app.id ? actionFor.mode : null;
                  return (
                    <article key={app.id} className="card overflow-hidden rounded-2xl shadow-sm">
                      <button
                        onClick={() => setExpanded(isOpen ? null : app.id)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{app.student_name}</span>
                            {app.student_faculty && (
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                {app.student_faculty}
                              </span>
                            )}
                            {app.course && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {app.course} курс {app.student_group ?? ""}
                              </span>
                            )}
                            {app.study_form && (
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                {app.study_form}
                              </span>
                            )}
                            {app.student_gpa && (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                GPA {app.student_gpa}
                              </span>
                            )}
                            <StatusBadge status={app.status} />
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">
                            📚 {app.specialty || "Специальность не указана"} · 🏫{" "}
                            {universitiesText(app)} · 🔄 {app.participation || "Впервые"} · 📅{" "}
                            {formatDate(app.created_at)}
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp size={18} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={18} className="text-slate-400" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="space-y-4 border-t border-[color:var(--border)] p-4">
                          <StatusTimeline status={app.status} />
                          <ApplicationDetails app={app} />

                          {/* Панель управления этапами департамента */}
                          {currentMode === "fix" ? (
                            <FixForm
                              app={app}
                              title="✏️ Вернуть пакет документов на исправление (департамент)"
                              onCancel={() => setActionFor({ id: "", mode: null })}
                              onSubmit={async (feedback, comment) => {
                                const ok = await applyUpdate(app.id, {
                                  status: STATUS.DEPARTMENT_FIX,
                                  doc_feedback: feedback,
                                  dept_comment: comment,
                                });
                                if (ok) {
                                  setActionFor({ id: "", mode: null });
                                  loadApps();
                                }
                              }}
                            />
                          ) : currentMode === "reject" ? (
                            <ReasonForm
                              title="✗ Полностью отклонить заявку (департамент)"
                              placeholder="Причина полного отклонения заявки…"
                              submitLabel="Отклонить заявку"
                              onCancel={() => setActionFor({ id: "", mode: null })}
                              onSubmit={async (reason) => {
                                const ok = await applyUpdate(app.id, {
                                  status: STATUS.DEPARTMENT_REJECTED,
                                  dept_comment: reason,
                                });
                                if (ok) {
                                  setActionFor({ id: "", mode: null });
                                  loadApps();
                                }
                              }}
                            />
                          ) : currentMode === "invite_test" ? (
                            <EventForm
                              kind="test"
                              initial={app.test_info}
                              onCancel={() => setActionFor({ id: "", mode: null })}
                              onSubmit={async (info) => {
                                const ok = await applyUpdate(app.id, {
                                  status: STATUS.TEST,
                                  test_info: info,
                                });
                                if (ok) {
                                  setActionFor({ id: "", mode: null });
                                  loadApps();
                                }
                              }}
                            />
                          ) : currentMode === "result_test" ? (
                            <ResultForm
                              title="📝 Результат тестирования (Прошёл / Не прошёл)"
                              onCancel={() => setActionFor({ id: "", mode: null })}
                              onSubmit={async (passed, comment) => {
                                const ok = await applyUpdate(app.id, {
                                  status: passed ? STATUS.TEST_PASSED : STATUS.TEST_FAILED,
                                  test_result: passed ? "Прошёл" : "Не прошёл",
                                  dept_comment: comment || app.dept_comment,
                                });
                                if (ok) {
                                  setActionFor({ id: "", mode: null });
                                  loadApps();
                                }
                              }}
                            />
                          ) : currentMode === "invite_interview" ? (
                            <EventForm
                              kind="interview"
                              initial={app.interview_info}
                              onCancel={() => setActionFor({ id: "", mode: null })}
                              onSubmit={async (info) => {
                                const ok = await applyUpdate(app.id, {
                                  status: STATUS.INTERVIEW,
                                  interview_info: info,
                                });
                                if (ok) {
                                  setActionFor({ id: "", mode: null });
                                  loadApps();
                                }
                              }}
                            />
                          ) : currentMode === "result_interview" ? (
                            <ResultForm
                              title="🎤 Результат интервью (Прошёл / Не прошёл)"
                              onCancel={() => setActionFor({ id: "", mode: null })}
                              onSubmit={async (passed, comment) => {
                                const ok = await applyUpdate(app.id, {
                                  status: passed
                                    ? STATUS.INTERVIEW_PASSED
                                    : STATUS.INTERVIEW_FAILED,
                                  interview_result: passed ? "Прошёл" : "Не прошёл",
                                  dept_comment: comment || app.dept_comment,
                                });
                                if (ok) {
                                  setActionFor({ id: "", mode: null });
                                  loadApps();
                                }
                              }}
                            />
                          ) : currentMode === "decision" ? (
                            <DecisionForm
                              app={app}
                              onCancel={() => setActionFor({ id: "", mode: null })}
                              onSubmit={async (info) => {
                                const ok = await applyUpdate(app.id, {
                                  status:
                                    info.decision === "Принято"
                                      ? STATUS.ACCEPTED
                                      : STATUS.NOT_ACCEPTED,
                                  decision_info: info,
                                  dept_comment: info.comment,
                                });
                                if (ok) {
                                  setActionFor({ id: "", mode: null });
                                  loadApps();
                                }
                              }}
                            />
                          ) : (
                            <div className="space-y-2 border-t border-[color:var(--border)] pt-3">
                              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                Действия департамента (каждое действие отправляет письмо студенту):
                              </div>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <button
                                  onClick={async () => {
                                    const ok = await applyUpdate(app.id, {
                                      status: STATUS.DEPARTMENT_REVIEW,
                                    });
                                    if (ok) loadApps();
                                  }}
                                  className="rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition"
                                >
                                  🏛 На рассмотрение
                                </button>
                                <button
                                  onClick={async () => {
                                    const ok = await applyUpdate(app.id, {
                                      status: STATUS.DEPARTMENT_APPROVED,
                                      doc_feedback: {},
                                    });
                                    if (ok) loadApps();
                                  }}
                                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                                >
                                  ✓ Одобрить документы
                                </button>
                                <button
                                  onClick={() => setActionFor({ id: app.id, mode: "fix" })}
                                  className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition"
                                >
                                  ✏️ На исправление
                                </button>
                                <button
                                  onClick={() => setActionFor({ id: app.id, mode: "reject" })}
                                  className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
                                >
                                  ✗ Полностью отклонить
                                </button>
                                <button
                                  onClick={() =>
                                    setActionFor({ id: app.id, mode: "invite_test" })
                                  }
                                  className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition"
                                >
                                  📝 Пригласить на тест
                                </button>
                                <button
                                  onClick={() =>
                                    setActionFor({ id: app.id, mode: "result_test" })
                                  }
                                  className="rounded-xl bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-200 transition"
                                >
                                  ☑️ Итог теста (Прошёл/Нет)
                                </button>
                                <button
                                  onClick={() =>
                                    setActionFor({ id: app.id, mode: "invite_interview" })
                                  }
                                  className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
                                >
                                  🎤 Пригласить на интервью
                                </button>
                                <button
                                  onClick={() =>
                                    setActionFor({ id: app.id, mode: "result_interview" })
                                  }
                                  className="rounded-xl bg-teal-100 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-200 transition"
                                >
                                  ☑️ Итог интервью (Прошёл/Нет)
                                </button>
                              </div>
                              <button
                                onClick={() => setActionFor({ id: app.id, mode: "decision" })}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
                              >
                                🏁 Вынести итоговое решение (Принято / Не принято / В какой вуз прошёл)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
