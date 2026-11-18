"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LogOut,
  FileText,
  Camera,
  MapPin,
  Milestone,
  Bot,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, signOut } from "@/lib/auth";
import { uploadDocuments, uploadAvatar, getDocumentUrl } from "@/lib/storage";
import { STATUS } from "@/lib/statuses";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { FileUpload, type PickedFile } from "@/components/FileUpload";
import { ChatBox } from "@/components/ChatBox";
import toast from "react-hot-toast";
import {
  FACULTIES,
  SEMESTERS,
  CURRENT_SEMESTER,
  type Profile,
  type Application,
} from "@/lib/types";

type Tab = "home" | "apply" | "status" | "chat" | "profile";

interface AppForm {
  semester: string;
  student_faculty: string;
  student_group: string;
  student_phone: string;
  student_gpa: string;
  purpose: string;
  university_name: string;
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "Главная" },
  { id: "apply", icon: "📤", label: "Подать заявку" },
  { id: "status", icon: "📊", label: "Мои заявки" },
  { id: "chat", icon: "🤖", label: "ИИ-ассистент" },
  { id: "profile", icon: "👤", label: "Профиль" },
];

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<Profile | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // Если редактируем/переподаём отклонённую заявку
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Форма заявки
  const [appForm, setAppForm] = useState<AppForm>({
    semester: CURRENT_SEMESTER,
    student_faculty: FACULTIES[0],
    student_group: "",
    student_phone: "",
    student_gpa: "3.5",
    purpose: "",
    university_name: "",
  });
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [sending, setSending] = useState(false);

  // Профиль
  const [profileForm, setProfileForm] = useState({
    name: "",
    group_name: "",
    faculty: FACULTIES[0] as string,
    phone: "",
    gpa: "",
    course: "2",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      if (!profile) {
        router.push("/auth");
        return;
      }
      setStudent(profile);
      setProfileForm({
        name: profile.name,
        group_name: profile.group_name ?? "",
        faculty: profile.faculty || FACULTIES[0],
        phone: profile.phone ?? "",
        gpa: profile.gpa ? String(profile.gpa) : "",
        course: profile.course ? String(profile.course) : "2",
      });
      setAppForm((prev) => ({
        ...prev,
        student_faculty: profile.faculty || FACULTIES[0],
        student_group: profile.group_name ?? "",
        student_phone: profile.phone ?? "",
        student_gpa: profile.gpa ? String(profile.gpa) : "3.5",
      }));
      setAvatarUrl(profile.avatar_url);

      const { data } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setApps(data as Application[]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Заполнение формы данными отклонённой заявки для повторной подачи
  const startResubmit = (app: Application) => {
    setEditingAppId(app.id);
    setAppForm({
      semester: app.semester || CURRENT_SEMESTER,
      student_faculty: app.student_faculty || student?.faculty || FACULTIES[0],
      student_group: app.student_group || student?.group_name || "",
      student_phone: app.student_phone || student?.phone || "",
      student_gpa: app.student_gpa ? String(app.student_gpa) : "3.5",
      purpose: app.purpose,
      university_name: app.university_name,
    });
    setFiles([]);
    setActiveTab("apply");
    toast("Загрузите исправленные документы и отправьте заявку повторно", { icon: "📝" });
  };

  // Открыть собственный загруженный документ
  const openDoc = async (path?: string) => {
    if (!path) return;
    const url = await getDocumentUrl(path);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Не удалось открыть документ");
    }
  };

  // Отправка заявки: файлы уезжают в Storage, в БД — только пути
  const sendApplication = async () => {
    if (!student) return;
    if (!appForm.university_name.trim()) {
      toast.error("Укажите университет назначения");
      return;
    }
    if (!appForm.purpose.trim()) {
      toast.error("Укажите цель поездки");
      return;
    }
    const gpaNum = parseFloat(appForm.student_gpa.replace(",", "."));
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
      toast.error("Укажите корректный GPA (от 0.0 до 4.0)");
      return;
    }
    if (files.length === 0) {
      toast.error("Прикрепите документы");
      return;
    }

    setSending(true);
    const appId = editingAppId ?? crypto.randomUUID();
    const uploaded = await uploadDocuments(
      student.id,
      appId,
      files.map((f) => f.file)
    );

    if ("error" in uploaded) {
      toast.error(uploaded.error);
      setSending(false);
      return;
    }

    // Даты по умолчанию для совместимости со старой схемой БД (пока не убрали NOT NULL)
    const todayIso = new Date().toISOString().slice(0, 10);

    const basePayload = {
      student_name: student.name,
      student_email: student.email,
      university_name: appForm.university_name.trim(),
      purpose: appForm.purpose.trim(),
      date_from: todayIso,
      date_to: todayIso,
      status: STATUS.FACULTY_REVIEW,
      file_names: uploaded.names,
      file_paths: uploaded.paths,
    };

    const fullPayload = {
      ...basePayload,
      semester: appForm.semester,
      student_faculty: appForm.student_faculty,
      student_group: appForm.student_group.trim() || null,
      student_phone: appForm.student_phone.trim() || null,
      student_gpa: gpaNum,
    };

    let dbError = null;

    if (editingAppId) {
      const { error } = await supabase
        .from("applications")
        .update({ ...fullPayload, faculty_comment: "", dept_comment: "" })
        .eq("id", editingAppId);
      dbError = error;
    } else {
      const { error } = await supabase
        .from("applications")
        .insert({ id: appId, student_id: student.id, ...fullPayload });
      if (error && error.message?.includes("column")) {
        // Фолбэк, если в Supabase ещё не запустили обновлённый migration.sql
        const retry = await supabase
          .from("applications")
          .insert({ id: appId, student_id: student.id, ...basePayload });
        dbError = retry.error;
      } else {
        dbError = error;
      }
    }

    if (dbError) {
      toast.error("Ошибка отправки заявки: " + dbError.message);
      setSending(false);
      return;
    }

    // Отправляем email-уведомление студенту о принятии заявки на 1-й этап (На проверке факультетом)
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentEmail: student.email,
        studentName: student.name,
        status: STATUS.FACULTY_REVIEW,
      }),
    }).catch(() => {});

    toast.success(
      editingAppId
        ? "Заявка обновлена и отправлена повторно! 🎉"
        : "Заявка отправлена! Отслеживайте статус 🎉"
    );
    setEditingAppId(null);
    setFiles([]);
    setAppForm((prev) => ({
      ...prev,
      purpose: "",
      university_name: "",
    }));
    setActiveTab("status");

    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setSending(false);
  };

  // Сохранение профиля: данные + аватар в Storage
  const saveProfile = async () => {
    if (!student) return;
    if (!profileForm.name.trim()) {
      toast.error("Имя не может быть пустым");
      return;
    }

    setSavingProfile(true);
    let newAvatar = avatarUrl;

    const picked = avatarInputRef.current?.files?.[0];
    if (picked) {
      newAvatar = await uploadAvatar(student.id, picked);
      if (!newAvatar) toast.error("Аватар не загрузился, но данные сохранятся");
    }

    const gpaVal = profileForm.gpa ? parseFloat(profileForm.gpa.replace(",", ".")) : null;
    const courseVal = profileForm.course ? parseInt(profileForm.course, 10) : null;

    const fullUpdate = {
      name: profileForm.name.trim(),
      group_name: profileForm.group_name.trim() || null,
      faculty: profileForm.faculty || null,
      phone: profileForm.phone.trim() || null,
      gpa: gpaVal && !isNaN(gpaVal) ? gpaVal : null,
      course: courseVal && !isNaN(courseVal) ? courseVal : null,
      avatar_url: newAvatar,
    };

    let { error } = await supabase.from("profiles").update(fullUpdate).eq("id", student.id);
    if (error && error.message?.includes("column")) {
      // Фолбэк на базовые колонки, если миграция ещё не применена
      const retry = await supabase
        .from("profiles")
        .update({
          name: profileForm.name.trim(),
          group_name: profileForm.group_name.trim() || null,
          avatar_url: newAvatar,
        })
        .eq("id", student.id);
      error = retry.error;
    }

    if (error) {
      toast.error("Ошибка сохранения");
      setSavingProfile(false);
      return;
    }

    const updated: Profile = {
      ...student,
      ...fullUpdate,
    };
    setStudent(updated);
    setAvatarUrl(newAvatar);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setSavingProfile(false);
    toast.success("Профиль обновлён! ✅");
  };

  if (loading || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <GraduationCap size={36} className="animate-pulse text-blue-600" />
          <div className="text-sm text-slate-500">Загрузка кабинета…</div>
        </div>
      </div>
    );
  }

  const inputClass =
    "card w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 transition placeholder:text-slate-400";

  return (
    <div className="flex min-h-screen bg-[color:var(--background)]">
      {/* Боковая панель (десктоп) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-blue-950 to-blue-900 text-white md:flex">
        <div className="border-b border-white/10 p-6 text-center">
          <button onClick={() => setActiveTab("profile")} className="group mx-auto block">
            <div className="mx-auto h-16 w-16 overflow-hidden rounded-full bg-white/20 shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold">
                  {student.name?.[0] ?? "?"}
                </div>
              )}
            </div>
            <div className="mt-3 text-sm font-semibold group-hover:underline">{student.name}</div>
            <div className="text-[11px] text-blue-300">{student.group_name || student.email}</div>
            {student.faculty && (
              <div className="mt-0.5 truncate text-[10px] text-blue-300/70">{student.faculty}</div>
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition ${
                activeTab === tab.id ? "bg-white/15 font-semibold" : "hover:bg-white/8"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl border border-white/20 px-4 py-2.5 text-sm text-blue-200 transition hover:bg-white/10"
          >
            <LogOut size={15} /> Выйти
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {/* Мобильная нижняя навигация */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[color:var(--border)] bg-[color:var(--card)] md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
                activeTab === tab.id ? "font-bold text-blue-600" : "text-slate-400"
              }`}
            >
              <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          {/* Главная */}
          {activeTab === "home" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-600 p-6 text-white shadow-lg">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-medium">
                  📅 Текущий поток: {CURRENT_SEMESTER}
                </div>
                <h1 className="mt-2 text-lg font-bold">
                  Сәлеметсіз бе, {student.name.split(" ")[0]}! 👋
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Платформа академической мобильности АРСУ. Подайте заявку на предстоящий семестр и следите за её статусом.
                </p>
                <button
                  onClick={() => {
                    setEditingAppId(null);
                    setActiveTab("apply");
                  }}
                  className="mt-4 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
                >
                  📤 Подать заявку
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => setActiveTab("status")}
                  className="card rounded-2xl p-4 text-left shadow-sm transition hover:border-blue-400"
                >
                  <div className="text-2xl font-bold text-blue-600">{apps.length}</div>
                  <div className="mt-1 text-xs text-slate-500">Мои заявки</div>
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className="card rounded-2xl p-4 text-left shadow-sm transition hover:border-blue-400"
                >
                  <div className="text-2xl font-bold text-indigo-600">🤖</div>
                  <div className="mt-1 text-xs text-slate-500">Спросить ИИ-ассистента</div>
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="card rounded-2xl p-4 text-left shadow-sm transition hover:border-blue-400"
                >
                  <div className="text-2xl font-bold text-teal-600">👤</div>
                  <div className="mt-1 text-xs text-slate-500">Заполнить профиль</div>
                </button>
              </div>

              {apps[0] && (
                <div className="card rounded-2xl p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-500">Последняя заявка</h3>
                    {apps[0].semester && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                        {apps[0].semester}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{apps[0].university_name}</span>
                    <StatusBadge status={apps[0].status} />
                  </div>
                  <div className="mt-3">
                    <StatusTimeline status={apps[0].status} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Подача заявки */}
          {activeTab === "apply" && (
            <div className="card rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-bold">
                  {editingAppId
                    ? "🔄 Исправление и повторная подача заявки"
                    : "📤 Новая заявка на мобильность"}
                </h1>
                {editingAppId && (
                  <button
                    onClick={() => setEditingAppId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Отменить редактирование
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Заявка уйдёт на проверку вашему факультету, далее — в департамент академической мобильности.
              </p>

              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-slate-500">
                    Поток (семестр) *
                    <select
                      value={appForm.semester}
                      onChange={(e) => setAppForm({ ...appForm, semester: e.target.value })}
                      className={`${inputClass} mt-1`}
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-500">
                    Ваш факультет *
                    <select
                      value={appForm.student_faculty}
                      onChange={(e) => setAppForm({ ...appForm, student_faculty: e.target.value })}
                      className={`${inputClass} mt-1`}
                    >
                      {FACULTIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs text-slate-500">
                    Группа *
                    <input
                      value={appForm.student_group}
                      onChange={(e) => setAppForm({ ...appForm, student_group: e.target.value })}
                      placeholder="Например IT-202"
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Средний балл (GPA) *
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={appForm.student_gpa}
                      onChange={(e) => setAppForm({ ...appForm, student_gpa: e.target.value })}
                      placeholder="3.50"
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Телефон *
                    <input
                      value={appForm.student_phone}
                      onChange={(e) => setAppForm({ ...appForm, student_phone: e.target.value })}
                      placeholder="+7 700 000 00 00"
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                </div>

                <label className="block text-xs text-slate-500">
                  Принимающий университет *
                  <input
                    value={appForm.university_name}
                    onChange={(e) => setAppForm({ ...appForm, university_name: e.target.value })}
                    placeholder="Название вуза и город / страна *"
                    className={`${inputClass} mt-1`}
                  />
                </label>

                <label className="block text-xs text-slate-500">
                  Цель поездки и направление обучения *
                  <textarea
                    value={appForm.purpose}
                    onChange={(e) => setAppForm({ ...appForm, purpose: e.target.value })}
                    placeholder="Обучение по программе академической мобильности, специальность, перезачёт кредитов…"
                    rows={3}
                    className={`${inputClass} mt-1 resize-none`}
                  />
                </label>

                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-slate-600">
                  <div className="font-semibold text-blue-800">📎 Рекомендуемый пакет документов:</div>
                  <div className="mt-1">
                    Транскрипт (GPA от 3.0), заявление, удостоверение личности / паспорт, письмо-приглашение (или мотивационное письмо), мед. справка 086-у.
                  </div>
                </div>

                <FileUpload files={files} setFiles={setFiles} />

                <button
                  onClick={sendApplication}
                  disabled={sending}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {sending
                    ? "⏳ Отправляем…"
                    : editingAppId
                      ? "Сохранить и отправить повторно"
                      : "Отправить заявку"}
                </button>
              </div>
            </div>
          )}

          {/* Мои заявки */}
          {activeTab === "status" && (
            <div className="space-y-3">
              <h1 className="text-base font-bold">📊 Мои заявки</h1>
              {apps.length === 0 ? (
                <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">
                  Заявок пока нет.{" "}
                  <button
                    onClick={() => setActiveTab("apply")}
                    className="text-blue-600 hover:underline"
                  >
                    Подать первую →
                  </button>
                </div>
              ) : (
                apps.map((app) => {
                  const isRejected =
                    app.status === STATUS.REJECTED || app.status === STATUS.FACULTY_REJECTED;
                  return (
                    <article key={app.id} className="card rounded-2xl p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold">{app.university_name}</span>
                          {app.semester && (
                            <span className="ml-2 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                              {app.semester}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        📅 Подана {new Date(app.created_at).toLocaleDateString("ru-RU")}
                        {app.student_faculty && <> · 🏛 {app.student_faculty}</>}
                        {app.student_group && <> · {app.student_group}</>}
                      </div>
                      <div className="mt-3">
                        <StatusTimeline status={app.status} />
                      </div>
                      {isRejected && (app.dept_comment || app.faculty_comment) && (
                        <div className="mt-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                          💬 Причина: {app.dept_comment || app.faculty_comment}
                        </div>
                      )}
                      {app.file_names.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {app.file_names.map((name, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => openDoc(app.file_paths[i])}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700 transition hover:bg-blue-100"
                            >
                              <FileText size={11} /> {name} <ExternalLink size={10} />
                            </button>
                          ))}
                        </div>
                      )}
                      {isRejected && (
                        <div className="mt-3 border-t border-[color:var(--border)] pt-3">
                          <button
                            onClick={() => startResubmit(app)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            <RotateCcw size={13} /> Исправить и подать повторно
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* ИИ-ассистент */}
          {activeTab === "chat" && (
            <div className="card flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl shadow-sm md:h-[calc(100vh-48px)]">
              <div className="flex items-center gap-2 border-b border-[color:var(--border)] p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  <Bot size={17} />
                </div>
                <div>
                  <div className="text-sm font-semibold">ИИ-ассистент АРСУ</div>
                  <div className="text-[11px] text-slate-400">
                    Отвечает на русском, казахском и английском + голосовой ввод
                  </div>
                </div>
              </div>
              <ChatBox className="flex-1 min-h-0" />
            </div>
          )}

          {/* Профиль */}
          {activeTab === "profile" && (
            <div className="card rounded-2xl p-5 shadow-sm">
              <h1 className="text-base font-bold">👤 Мой профиль</h1>

              {/* Аватар */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative"
                  aria-label="Сменить аватар"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-200 shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Аватар" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-500">
                        {student.name?.[0] ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow transition group-hover:bg-blue-700">
                    <Camera size={13} />
                  </div>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={() => saveProfile()}
                />
                <div className="text-xs text-slate-500">
                  <div className="font-medium text-slate-700">{student.email}</div>
                  <div className="mt-0.5">Нажмите на аватар, чтобы сменить фото</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="block text-xs text-slate-500">
                  ФИО студента *
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="ФИО *"
                    className={`${inputClass} mt-1`}
                  />
                </label>

                <label className="block text-xs text-slate-500">
                  Факультет
                  <select
                    value={profileForm.faculty}
                    onChange={(e) => setProfileForm({ ...profileForm, faculty: e.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs text-slate-500">
                    Группа
                    <input
                      value={profileForm.group_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, group_name: e.target.value })
                      }
                      placeholder="IT-202"
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Курс
                    <select
                      value={profileForm.course}
                      onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
                      className={`${inputClass} mt-1`}
                    >
                      {["1", "2", "3", "4", "5"].map((c) => (
                        <option key={c} value={c}>
                          {c} курс
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-500">
                    Средний балл (GPA)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={profileForm.gpa}
                      onChange={(e) => setProfileForm({ ...profileForm, gpa: e.target.value })}
                      placeholder="3.50"
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                </div>

                <label className="block text-xs text-slate-500">
                  Телефон для связи
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+7 700 000 00 00"
                    className={`${inputClass} mt-1`}
                  />
                </label>

                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingProfile ? "⏳ Сохраняем…" : "Сохранить"}
                </button>
              </div>

              <div className="card mt-5 rounded-xl p-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Milestone size={13} /> Как это работает
                </div>
                <div className="mt-1.5 flex items-start gap-1.5">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-blue-500" />
                  Заявка проходит: факультет → департамент → тестирование → интервью → решение.
                  На каждом шаге придёт письмо на {student.email}.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
