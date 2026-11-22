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
  Table,
  LayoutList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, signOut } from "@/lib/auth";
import { STATUS, inGroup, type GroupKey } from "@/lib/statuses";
import { applyUpdate } from "@/lib/workflow";
import { downloadCsv, FULL_HEADERS, fullRow } from "@/lib/export";
import { formatDate, universitiesText } from "@/lib/application";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ApplicationDetails } from "@/components/ApplicationDetails";
import { StudentsTable } from "@/components/StudentsTable";
import { RecommendForm, FixForm, ReasonForm } from "@/components/ReviewForms";
import toast from "react-hot-toast";
import { FACULTIES, SEMESTERS, type Application, type Profile } from "@/lib/types";

const FACULTY_GROUPS: { key: "all" | GroupKey; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "review", label: "На проверке" },
  { key: "fix", label: "На исправлении" },
  { key: "recommended", label: "Рекомендованы" },
  { key: "department", label: "На рассмотрении департамента" },
  { key: "test", label: "Тестирование" },
  { key: "interview", label: "Интервью" },
  { key: "accepted", label: "Принято" },
  { key: "rejected", label: "Не рекомендованы / отклонены" },
];

type ActionMode = "recommend" | "fix" | "reject" | null;

export default function FacultyDashboard() {
  const supabase = createClient();

  const [apps, setApps] = useState<Application[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [groupFilter, setGroupFilter] = useState<"all" | GroupKey>("all");
  const [semesterFilter, setSemesterFilter] = useState("все");
  const [facultyFilter, setFacultyFilter] = useState("все");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionFor, setActionFor] = useState<{ id: string; mode: ActionMode }>({
    id: "",
    mode: null,
  });

  useEffect(() => {
    (async () => {
      const prof = await getProfile();
      if (prof) {
        setMyProfile(prof);
        if (prof.faculty) setFacultyFilter(prof.faculty);
      }
      await loadApps();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApps = async () => {
    setLoading(true);
    // RLS на уровне БД гарантирует, что координатор факультета видит своих студентов
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setLoading(false);
  };

  // Фильтрация по потоку, факультету и поиску
  const baseFiltered = apps.filter((a) => {
    if (semesterFilter !== "все" && (a.semester || "") !== semesterFilter) return false;
    if (facultyFilter !== "все" && (a.student_faculty || "") !== facultyFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = [
        a.student_name,
        a.university_name,
        a.student_email,
        a.student_group ?? "",
        a.specialty ?? "",
      ].some((v) => v.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const filtered =
    groupFilter === "all"
      ? baseFiltered
      : baseFiltered.filter((a) => inGroup(a.status, groupFilter));

  const countGroup = (k: "all" | GroupKey) =>
    k === "all" ? baseFiltered.length : baseFiltered.filter((a) => inGroup(a.status, k)).length;

  const exportExcel = () => {
    if (filtered.length === 0) {
      toast.error("Нет заявок для выгрузки");
      return;
    }
    downloadCsv(
      `arsu_faculty_students_${new Date().toISOString().slice(0, 10)}.csv`,
      FULL_HEADERS,
      filtered.map(fullRow)
    );
    toast.success("Полный список студентов выгружен в Excel (CSV)");
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={22} />
            <div>
              <div className="text-sm font-bold">Кабинет координатора факультета</div>
              <div className="text-[11px] text-teal-200">
                {myProfile?.faculty
                  ? `${myProfile.faculty} (${myProfile.email})`
                  : "Проверка заявок и пакета документов студентов"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium transition hover:bg-white/25"
            >
              {viewMode === "cards" ? (
                <>
                  <Table size={13} /> Полный список (Таблица)
                </>
              ) : (
                <>
                  <LayoutList size={13} /> Карточки заявок
                </>
              )}
            </button>
            <button
              onClick={exportExcel}
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

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Поиск + фильтр потока и факультета */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ФИО, шифру специальности, группе, вузу…"
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
            disabled={Boolean(myProfile?.faculty)}
            className="card w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 transition disabled:opacity-70"
          >
            <option value="все">Все факультеты</option>
            {FACULTIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтры по этапам (включая «На рассмотрении департамента», «Тестирование» и т.д.) */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FACULTY_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setGroupFilter(g.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                groupFilter === g.key
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                  : "card hover:border-teal-400"
              }`}
            >
              {g.label} ({countGroup(g.key)})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-28 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : viewMode === "table" ? (
          <StudentsTable
            apps={filtered}
            onSelect={(app) => {
              setViewMode("cards");
              setExpanded(app.id);
            }}
          />
        ) : filtered.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">
            Заявок пока нет 🎓
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
                        {app.semester && (
                          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                            {app.semester}
                          </span>
                        )}
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        📚 {app.specialty || "Специальность не указана"} · 🏫{" "}
                        {universitiesText(app)} · 📅 Подана {formatDate(app.created_at)}
                        {app.participation && <> · 🔄 {app.participation}</>}
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

                      {/* Кнопки решений координатора факультета */}
                      {currentMode === "recommend" ? (
                        <RecommendForm
                          onCancel={() => setActionFor({ id: "", mode: null })}
                          onSubmit={async (deadline, comment) => {
                            const ok = await applyUpdate(app.id, {
                              status: STATUS.FACULTY_RECOMMENDED,
                              faculty_deadline: deadline || null,
                              faculty_comment: comment,
                              doc_feedback: {},
                            });
                            if (ok) {
                              setActionFor({ id: "", mode: null });
                              loadApps();
                            }
                          }}
                        />
                      ) : currentMode === "fix" ? (
                        <FixForm
                          app={app}
                          title="✏️ Отправить пакет документов студенту на исправление"
                          onCancel={() => setActionFor({ id: "", mode: null })}
                          onSubmit={async (feedback, comment) => {
                            const ok = await applyUpdate(app.id, {
                              status: STATUS.FACULTY_FIX,
                              doc_feedback: feedback,
                              faculty_comment: comment,
                            });
                            if (ok) {
                              setActionFor({ id: "", mode: null });
                              loadApps();
                            }
                          }}
                        />
                      ) : currentMode === "reject" ? (
                        <ReasonForm
                          title="✗ Не рекомендовать заявку (укажите причину — студент сможет исправить и сдать заново)"
                          placeholder="Причина отказа в рекомендации…"
                          submitLabel="Отправить решение"
                          onCancel={() => setActionFor({ id: "", mode: null })}
                          onSubmit={async (reason) => {
                            const ok = await applyUpdate(app.id, {
                              status: STATUS.FACULTY_REJECTED,
                              faculty_comment: reason,
                            });
                            if (ok) {
                              setActionFor({ id: "", mode: null });
                              loadApps();
                            }
                          }}
                        />
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-3">
                          <button
                            onClick={() => setActionFor({ id: app.id, mode: "recommend" })}
                            className="rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                          >
                            ✓ Рекомендовать (с дедлайном)
                          </button>
                          <button
                            onClick={() => setActionFor({ id: app.id, mode: "fix" })}
                            className="rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                          >
                            ✏️ На исправление документов
                          </button>
                          <button
                            onClick={() => setActionFor({ id: app.id, mode: "reject" })}
                            className="rounded-xl bg-red-500 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600"
                          >
                            ✗ Не рекомендовать (причина)
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
      </main>
    </div>
  );
}
