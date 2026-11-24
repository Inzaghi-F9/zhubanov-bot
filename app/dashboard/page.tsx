"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LogOut,
  Camera,
  MapPin,
  Milestone,
  Bot,
  RotateCcw,
  Plus,
  Trash2,
  Paperclip,
  X,
  FileText,
  AlertTriangle,
  Download,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, signOut } from "@/lib/auth";
import { uploadDocument, uploadAvatar } from "@/lib/storage";
import { STATUS, RESUBMITTABLE } from "@/lib/statuses";
import { notifyApplication } from "@/lib/workflow";
import { getDocuments, getUniversities, formatDate } from "@/lib/application";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ApplicationDetails } from "@/components/ApplicationDetails";
import { ChatBox } from "@/components/ChatBox";
import toast from "react-hot-toast";
import {
  FACULTIES,
  SEMESTERS,
  CURRENT_SEMESTER,
  EDUCATION_LEVELS,
  STUDY_FORMS,
  PARTICIPATION,
  COURSES,
  SOCIAL_STATUSES,
  DOCUMENT_TYPES,
  SOCIAL_DOCUMENT,
  MAX_UNIVERSITIES,
  FUNDING,
  fundingOptions,
  type Profile,
  type Application,
  type UniversityChoice,
  type AppDocument,
} from "@/lib/types";
import {
  PARTNER_COUNTRIES,
  ALL_PARTNER_UNIVERSITIES,
  RULES_UNIVERSITY_FUNDED,
  RULES_SELF_FUNDED,
} from "@/lib/partners";

type Tab = "home" | "apply" | "status" | "chat" | "profile";

interface DocDraft {
  file: File | null;
  existingName: string | null;
  existingPath: string | null;
  comment: string;
}

interface AppForm {
  semester: string;
  student_faculty: string;
  course: string;
  student_group: string;
  student_phone: string;
  student_gpa: string;
  birth_date: string;
  education_level: string;
  study_form: string;
  participation: string;
  funding_source: string;
  specialty: string;
  universities: UniversityChoice[];
  social_status: string[];
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

  // Если редактируем/переподаём заявку
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  // Форма заявки
  const [appForm, setAppForm] = useState<AppForm>({
    semester: CURRENT_SEMESTER,
    student_faculty: FACULTIES[0],
    course: "2",
    student_group: "",
    student_phone: "",
    student_gpa: "3.5",
    birth_date: "",
    education_level: EDUCATION_LEVELS[0],
    study_form: STUDY_FORMS[0],
    participation: PARTICIPATION[0],
    funding_source: "За счёт университета",
    specialty: "",
    universities: [{ name: "", country: "" }],
    social_status: [],
  });

  // Черновики по каждому документу из пакета
  const [docsDraft, setDocsDraft] = useState<Record<string, DocDraft>>({});
  const [rulesAccepted, setRulesAccepted] = useState(false);
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

  // Автоматическая подстройка источника финансирования при смене семестра / гранта / участия
  useEffect(() => {
    const opts = fundingOptions({
      semester: appForm.semester,
      study_form: appForm.study_form,
      education_level: appForm.education_level,
      participation: appForm.participation,
    });
    const currentAllowed = opts.find((o) => o.value === appForm.funding_source)?.allowed;
    if (!currentAllowed) {
      const firstAllowed = opts.find((o) => o.allowed);
      if (firstAllowed && firstAllowed.value !== appForm.funding_source) {
        setAppForm((prev) => ({ ...prev, funding_source: firstAllowed.value }));
      }
    }
  }, [
    appForm.semester,
    appForm.study_form,
    appForm.education_level,
    appForm.participation,
    appForm.funding_source,
  ]);

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
        course: profile.course ? String(profile.course) : "2",
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

  // Заполнение формы данными заявки, возвращённой на исправление
  const startResubmit = (app: Application) => {
    setEditingApp(app);
    const unis = getUniversities(app);
    setAppForm({
      semester: app.semester || CURRENT_SEMESTER,
      student_faculty: app.student_faculty || student?.faculty || FACULTIES[0],
      course: app.course ? String(app.course) : student?.course ? String(student.course) : "2",
      student_group: app.student_group || student?.group_name || "",
      student_phone: app.student_phone || student?.phone || "",
      student_gpa: app.student_gpa ? String(app.student_gpa) : "3.5",
      birth_date: app.birth_date ?? "",
      education_level: app.education_level || EDUCATION_LEVELS[0],
      study_form: app.study_form || STUDY_FORMS[0],
      participation: app.participation || PARTICIPATION[0],
      funding_source: app.funding_source || "За счёт университета",
      specialty: app.specialty ?? "",
      universities: unis.length > 0 ? unis : [{ name: "", country: "" }],
      social_status: app.social_status ?? [],
    });

    const existingDocs = getDocuments(app);
    const draftMap: Record<string, DocDraft> = {};
    for (const d of existingDocs) {
      draftMap[d.type] = {
        file: null,
        existingName: d.name,
        existingPath: d.path,
        comment: d.comment ?? "",
      };
    }
    setDocsDraft(draftMap);
    setRulesAccepted(true);
    setActiveTab("apply");
    toast("Исправьте отмеченные документы/данные и отправьте заявку повторно", { icon: "📝" });
  };

  const setDocFile = (type: string, file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error(`Файл «${file.name}» превышает 5 МБ`);
      return;
    }
    setDocsDraft((prev) => ({
      ...prev,
      [type]: {
        file,
        existingName: file ? null : prev[type]?.existingName ?? null,
        existingPath: file ? null : prev[type]?.existingPath ?? null,
        comment: prev[type]?.comment ?? "",
      },
    }));
  };

  const setDocComment = (type: string, comment: string) => {
    setDocsDraft((prev) => ({
      ...prev,
      [type]: {
        file: prev[type]?.file ?? null,
        existingName: prev[type]?.existingName ?? null,
        existingPath: prev[type]?.existingPath ?? null,
        comment,
      },
    }));
  };

  const toggleSocial = (item: string) => {
    setAppForm((prev) => {
      const exists = prev.social_status.includes(item);
      return {
        ...prev,
        social_status: exists
          ? prev.social_status.filter((s) => s !== item)
          : [...prev.social_status, item],
      };
    });
  };

  const updateUni = (idx: number, key: "name" | "country", val: string) => {
    setAppForm((prev) => ({
      ...prev,
      universities: prev.universities.map((u, i) => (i === idx ? { ...u, [key]: val } : u)),
    }));
  };

  const addUni = () => {
    if (appForm.universities.length >= MAX_UNIVERSITIES) return;
    setAppForm((prev) => ({
      ...prev,
      universities: [...prev.universities, { name: "", country: "" }],
    }));
  };

  const removeUni = (idx: number) => {
    if (appForm.universities.length <= 1) return;
    setAppForm((prev) => ({
      ...prev,
      universities: prev.universities.filter((_, i) => i !== idx),
    }));
  };

  // Отправка заявки
  const sendApplication = async () => {
    if (!student) return;
    if (!rulesAccepted) {
      toast.error("Талаптармен және құжаттар тізімімен танысқаныңызды растаңыз (құсбелгі қойыңыз)");
      return;
    }
    if (!appForm.birth_date) {
      toast.error("Укажите дату рождения");
      return;
    }
    if (!appForm.specialty.trim()) {
      toast.error("Укажите специальность с шифром (например, 6B06101 — Информационные системы)");
      return;
    }
    if (!appForm.student_group.trim()) {
      toast.error("Укажите вашу учебную группу");
      return;
    }
    if (!appForm.student_phone.trim()) {
      toast.error("Укажите телефон для связи");
      return;
    }
    const gpaNum = parseFloat(appForm.student_gpa.replace(",", "."));
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
      toast.error("Укажите корректный GPA (от 0.0 до 4.0)");
      return;
    }
    const minGpa = appForm.funding_source === FUNDING.OWN ? 2.8 : 3.0;
    if (gpaNum < minGpa) {
      toast.error(
        appForm.funding_source === FUNDING.OWN
          ? "Өз қаражаты есебінен қатысу үшін GPA кемінде 2.80 болуы тиіс"
          : "Университет / бюджет есебінен қатысу үшін GPA кемінде 3.00 болуы тиіс"
      );
      return;
    }

    const validUnis = appForm.universities
      .map((u) => ({ name: u.name.trim(), country: u.country.trim() }))
      .filter((u) => u.name.length > 0);

    if (validUnis.length === 0) {
      toast.error("Укажите хотя бы один принимающий вуз и страну");
      return;
    }
    if (validUnis.some((u) => !u.country)) {
      toast.error("Укажите страну для каждого выбранного вуза");
      return;
    }

    // Проверяем список документов: для обязательных должен быть либо файл, либо комментарий
    const activeDocTypes = [
      ...DOCUMENT_TYPES,
      ...(appForm.social_status.length > 0 ? [SOCIAL_DOCUMENT] : []),
    ];

    // Если студенту меньше 18 лет на сегодня — нотариальное согласие родителей обязательно
    const isMinor = (() => {
      const b = new Date(appForm.birth_date);
      if (isNaN(b.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - b.getFullYear();
      const m = today.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
      return age < 18;
    })();

    for (const dt of activeDocTypes) {
      const d = docsDraft[dt.type];
      const hasFile = Boolean(d?.file || d?.existingPath);
      const hasComment = Boolean(d?.comment?.trim());
      const mustHave = dt.required || (dt.type === "parent_consent" && isMinor);
      if (mustHave && !hasFile && !hasComment) {
        toast.error(`Документ «${dt.label}»: прикрепите файл или напишите комментарий`);
        return;
      }
    }

    setSending(true);
    const appId = editingApp?.id ?? crypto.randomUUID();
    const compiledDocs: AppDocument[] = [];
    const fileNames: string[] = [];
    const filePaths: string[] = [];

    for (const dt of activeDocTypes) {
      const d = docsDraft[dt.type];
      let finalName = d?.existingName ?? null;
      let finalPath = d?.existingPath ?? null;

      if (d?.file) {
        const res = await uploadDocument(student.id, appId, d.file, dt.type);
        if ("error" in res) {
          toast.error(res.error);
          setSending(false);
          return;
        }
        finalName = d.file.name;
        finalPath = res.path;
      }

      if (finalPath && finalName) {
        fileNames.push(finalName);
        filePaths.push(finalPath);
      }

      if (finalPath || d?.comment?.trim()) {
        compiledDocs.push({
          type: dt.type,
          label: dt.label,
          name: finalName,
          path: finalPath,
          comment: d?.comment?.trim() ?? "",
        });
      }
    }

    // Если возвращал департамент — статус уходит обратно в департамент, иначе — на проверку факультету
    const targetStatus =
      editingApp &&
      (editingApp.status === STATUS.DEPARTMENT_FIX || editingApp.status === STATUS.LEGACY_ERROR)
        ? STATUS.DEPARTMENT_REVIEW
        : STATUS.FACULTY_REVIEW;

    const primaryUni = validUnis[0];
    const todayIso = new Date().toISOString().slice(0, 10);

    const fullPayload = {
      student_name: student.name,
      student_email: student.email,
      student_faculty: appForm.student_faculty,
      course: parseInt(appForm.course, 10) || 2,
      student_group: appForm.student_group.trim(),
      student_phone: appForm.student_phone.trim(),
      student_gpa: gpaNum,
      birth_date: appForm.birth_date,
      education_level: appForm.education_level,
      study_form: appForm.study_form,
      participation: appForm.participation,
      funding_source: appForm.funding_source,
      specialty: appForm.specialty.trim(),
      semester: appForm.semester,
      universities: validUnis,
      university_name: `${primaryUni.name} (${primaryUni.country})`,
      country: primaryUni.country,
      social_status: appForm.social_status,
      documents: compiledDocs,
      purpose: appForm.specialty.trim(),
      date_from: todayIso,
      date_to: todayIso,
      status: targetStatus,
      file_names: fileNames,
      file_paths: filePaths,
    };

    let dbError = null;
    if (editingApp) {
      const { error } = await supabase
        .from("applications")
        .update(fullPayload)
        .eq("id", editingApp.id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from("applications")
        .insert({ id: appId, student_id: student.id, ...fullPayload });
      dbError = error;
    }

    if (dbError) {
      toast.error(
        "Ошибка сохранения заявки: " +
          dbError.message +
          " (убедитесь, что выполнен обновлённый migration.sql в Supabase)"
      );
      setSending(false);
      return;
    }

    // Отправляем email-уведомление студенту и координатору факультета / департаменту
    notifyApplication(appId).catch(() => {});

    toast.success(
      editingApp
        ? "Исправленная заявка отправлена повторно! Уведомление отправлено на почту 🎉"
        : "Заявка успешно подана! Уведомление отправлено на почту 🎉"
    );
    setEditingApp(null);
    setDocsDraft({});
    setActiveTab("status");

    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setSending(false);
  };

  // Сохранение профиля
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

    const { error } = await supabase.from("profiles").update(fullUpdate).eq("id", student.id);
    if (error) {
      toast.error("Ошибка сохранения: " + error.message);
      setSavingProfile(false);
      return;
    }

    setStudent({ ...student, ...fullUpdate });
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

  const activeDocList = [
    ...DOCUMENT_TYPES,
    ...(appForm.social_status.length > 0 ? [SOCIAL_DOCUMENT] : []),
  ];

  const availableFunding = fundingOptions({
    semester: appForm.semester,
    study_form: appForm.study_form,
    education_level: appForm.education_level,
    participation: appForm.participation,
  });

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

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
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
                  Платформа академической мобильности АРСУ. Подайте заявку, прикрепите пакет документов и отслеживайте каждый этап отбора.
                </p>
                <button
                  onClick={() => {
                    setEditingApp(null);
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
                  {editingApp
                    ? "🔄 Исправление и повторная отправка заявки"
                    : "📤 Анкета-заявка на академическую мобильность"}
                </h1>
                {editingApp && (
                  <button
                    onClick={() => {
                      setEditingApp(null);
                      setDocsDraft({});
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Отменить редактирование
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Заполните все поля анкеты. После отправки уведомление придёт вам на почту и координатору вашего факультета.
              </p>

              {editingApp &&
                (Object.keys(editingApp.doc_feedback ?? {}).length > 0 ||
                  editingApp.faculty_comment ||
                  editingApp.dept_comment) && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle size={14} /> Что нужно исправить:
                    </div>
                    {(editingApp.dept_comment || editingApp.faculty_comment) && (
                      <div className="mt-1">
                        💬 {editingApp.dept_comment || editingApp.faculty_comment}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-5">
                  {/* 0. Талаптар мен ережелер (өтінім берер алдында танысу) */}
                  <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 text-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-500">
                      <BookOpen size={16} />
                      Өтінім берер алдында ережелермен танысыңыз
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="card rounded-xl p-3.5 shadow-sm">
                        <div className="font-bold">
                          Университет қаражаты есебінен бара алатын үміткерлерге қойылатын жалпы талаптар:
                        </div>
                        <ul className="mt-2.5 space-y-1.5 opacity-80">
                          {RULES_UNIVERSITY_FUNDED.map((r) => (
                            <li key={r} className="flex items-start gap-2">
                              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="card rounded-xl p-3.5 shadow-sm">
                        <div className="font-bold">
                          Өз қаражаты есебінен баратын білім алушыларға:
                        </div>
                        <p className="mt-2.5 leading-relaxed opacity-80">{RULES_SELF_FUNDED}</p>
                      </div>
                    </div>

                    <label className="card mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-semibold transition hover:border-blue-500">
                      <input
                        type="checkbox"
                        checked={rulesAccepted}
                        onChange={(e) => setRulesAccepted(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-400 text-blue-600"
                      />
                      <span>
                        Жоғарыдағы талаптармен және қажетті құжаттар тізімімен толық таныстым *
                      </span>
                    </label>
                  </div>

                  {/* 1. Личные и учебные данные */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    1. Сведения о студенте и обучении
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
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
                      Уровень образования *
                      <select
                        value={appForm.education_level}
                        onChange={(e) =>
                          setAppForm({ ...appForm, education_level: e.target.value })
                        }
                        className={`${inputClass} mt-1`}
                      >
                        {EDUCATION_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">
                      Дата рождения *
                      <input
                        type="date"
                        value={appForm.birth_date}
                        onChange={(e) => setAppForm({ ...appForm, birth_date: e.target.value })}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-500">
                      Факультет *
                      <select
                        value={appForm.student_faculty}
                        onChange={(e) =>
                          setAppForm({ ...appForm, student_faculty: e.target.value })
                        }
                        className={`${inputClass} mt-1`}
                      >
                        {FACULTIES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">
                      Специальность (с шифром ОП) *
                      <input
                        value={appForm.specialty}
                        onChange={(e) => setAppForm({ ...appForm, specialty: e.target.value })}
                        placeholder="Например: 6B06101 — Информационные системы"
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <label className="text-xs text-slate-500">
                      Курс *
                      <select
                        value={appForm.course}
                        onChange={(e) => setAppForm({ ...appForm, course: e.target.value })}
                        className={`${inputClass} mt-1`}
                      >
                        {COURSES.map((c) => (
                          <option key={c} value={c}>
                            {c} курс
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">
                      Группа *
                      <input
                        value={appForm.student_group}
                        onChange={(e) => setAppForm({ ...appForm, student_group: e.target.value })}
                        placeholder="IT-202"
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
                </div>

                {/* 2. Форма обучения, кратность участия и источник финансирования */}
                <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    2. Форма обучения и финансирование
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-slate-500">
                      Форма обучения (Грант / Платное) *
                      <select
                        value={appForm.study_form}
                        onChange={(e) => setAppForm({ ...appForm, study_form: e.target.value })}
                        className={`${inputClass} mt-1`}
                      >
                        {STUDY_FORMS.map((sf) => (
                          <option key={sf} value={sf}>
                            {sf}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">
                      Участие в программе мобильности *
                      <select
                        value={appForm.participation}
                        onChange={(e) =>
                          setAppForm({ ...appForm, participation: e.target.value })
                        }
                        className={`${inputClass} mt-1`}
                      >
                        {PARTICIPATION.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <div className="mb-1.5 text-xs text-slate-500">Источник финансирования *</div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {availableFunding.map((opt) => {
                        const selected = appForm.funding_source === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`card flex flex-col justify-between rounded-xl p-3 text-xs transition ${
                              !opt.allowed
                                ? "cursor-not-allowed opacity-45"
                                : selected
                                  ? "cursor-pointer border-blue-500 bg-blue-50/70"
                                  : "cursor-pointer hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-semibold">
                              <input
                                type="radio"
                                name="funding_source"
                                disabled={!opt.allowed}
                                checked={selected}
                                onChange={() =>
                                  opt.allowed &&
                                  setAppForm({ ...appForm, funding_source: opt.value })
                                }
                              />
                              {opt.value}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">{opt.hint}</div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Принимающие вузы и страны (до 3 вузов) */}
                <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      3. Принимающие вузы и страны (до {MAX_UNIVERSITIES} вузов по приоритету)
                    </div>
                    {appForm.universities.length < MAX_UNIVERSITIES && (
                      <button
                        type="button"
                        onClick={addUni}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Plus size={13} /> Добавить вуз ({appForm.universities.length}/
                        {MAX_UNIVERSITIES})
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {appForm.universities.map((u, idx) => (
                      <div key={idx} className="card space-y-2 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              Таңдау №{idx + 1}
                            </span>
                          </div>
                          {appForm.universities.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUni(idx)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                              title="Удалить вуз"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <select
                          value={
                            ALL_PARTNER_UNIVERSITIES.some(
                              (p) => p.name === u.name && p.country === u.country
                            )
                              ? `${u.country}|||${u.name}`
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const [c, n] = val.split("|||");
                            setAppForm((prev) => ({
                              ...prev,
                              universities: prev.universities.map((item, i) =>
                                i === idx ? { name: n, country: c } : item
                              ),
                            }));
                          }}
                          className={inputClass}
                        >
                          <option value="">
                            — Тізімнен серіктес университетті таңдаңыз (немесе төменге жазыңыз) —
                          </option>
                          {PARTNER_COUNTRIES.map((pc) => (
                            <optgroup key={pc.country} label={`${pc.flag} ${pc.country}`}>
                              {pc.universities.map((uni) => (
                                <option key={uni} value={`${pc.country}|||${uni}`}>
                                  {uni} ({pc.country})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            value={u.name}
                            onChange={(e) => updateUni(idx, "name", e.target.value)}
                            placeholder={`Қабылдаушы университет №${idx + 1} *`}
                            className={inputClass}
                          />
                          <input
                            value={u.country}
                            onChange={(e) => updateUni(idx, "country", e.target.value)}
                            placeholder="Елі / Страна *"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Социальное положение */}
                <div className="space-y-2 border-t border-[color:var(--border)] pt-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    4. Социальное положение (если относится — отметьте и прикрепите подтверждающий документ ниже)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SOCIAL_STATUSES.map((st) => {
                      const active = appForm.social_status.includes(st);
                      return (
                        <label
                          key={st}
                          className={`card cursor-pointer rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                            active ? "border-blue-500 bg-blue-50 text-blue-700" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={active}
                            onChange={() => toggleSocial(st)}
                          />
                          {st}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Пакет документов: к каждому пункту файл и/или комментарий */}
                <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      5. Пакет документов (по каждому пункту прикрепите файл или укажите комментарий)
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Форматы: PDF, JPG, PNG, DOC, DOCX — до 5 МБ каждый файл.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {activeDocList.map((dt) => {
                      const draft = docsDraft[dt.type];
                      const fbNote = editingApp?.doc_feedback?.[dt.type];
                      const fileName = draft?.file?.name ?? draft?.existingName ?? null;
                      return (
                        <div
                          key={dt.type}
                          className={`card rounded-xl p-3 ${
                            fbNote ? "border-amber-400 bg-amber-50/40" : ""
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="text-xs font-semibold">
                                {dt.label}{" "}
                                {dt.required ? (
                                  <span className="text-red-500">*</span>
                                ) : (
                                  <span className="font-normal text-slate-400">(бар болса / опционально)</span>
                                )}
                              </div>
                              {dt.hint && (
                                <div className="text-[11px] text-slate-500">{dt.hint}</div>
                              )}
                              {dt.templateUrl && (
                                <a
                                  href={dt.templateUrl}
                                  download
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  <Download size={12} /> {dt.templateLabel ?? "Шаблонды жүктеу (.doc)"}
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {fileName ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                                  <FileText size={12} /> {fileName}
                                  <button
                                    type="button"
                                    onClick={() => setDocFile(dt.type, null)}
                                    aria-label="Удалить файл"
                                  >
                                    <X size={12} className="hover:text-red-500" />
                                  </button>
                                </span>
                              ) : null}

                              <label className="card inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:border-blue-400">
                                <Paperclip size={13} />
                                {fileName ? "Заменить файл" : "Прикрепить файл"}
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  hidden
                                  onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null;
                                    if (f) setDocFile(dt.type, f);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          {fbNote && (
                            <div className="mt-1.5 text-xs font-medium text-amber-700">
                              ⚠️ Замечание проверяющего: {fbNote}
                            </div>
                          )}

                          <input
                            value={draft?.comment ?? ""}
                            onChange={(e) => setDocComment(dt.type, e.target.value)}
                            placeholder="Комментарий к документу (например: «сдам до пятницы» или пояснение)"
                            className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={sendApplication}
                  disabled={sending}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {sending
                    ? "⏳ Загружаем документы и отправляем заявку…"
                    : editingApp
                      ? "Сохранить исправления и отправить заново"
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
                  const canResubmit = RESUBMITTABLE.includes(app.status);
                  return (
                    <article key={app.id} className="card space-y-3 rounded-2xl p-4 shadow-sm">
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
                      <div className="text-xs text-slate-500">
                        📅 Подана {formatDate(app.created_at)}
                        {app.student_faculty && <> · 🏛 {app.student_faculty}</>}
                        {app.specialty && <> · 📚 {app.specialty}</>}
                      </div>

                      <StatusTimeline status={app.status} />

                      <ApplicationDetails app={app} />

                      {canResubmit && (
                        <div className="border-t border-[color:var(--border)] pt-3">
                          <button
                            onClick={() => startResubmit(app)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            <RotateCcw size={13} /> Исправить документы и сдать заново
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
                      {COURSES.map((c) => (
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
                  Заявка проходит: проверка факультета → рекомендация → рассмотрение департаментом → тестирование → интервью → итоговое решение. На каждом этапе вам приходит уведомление на {student.email}.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
