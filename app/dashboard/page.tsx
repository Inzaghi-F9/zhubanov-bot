"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LogOut, Send, FileText, Camera, MapPin, Milestone, Bot, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, signOut } from "@/lib/auth";
import { uploadDocuments, uploadAvatar } from "@/lib/storage";
import { STATUS } from "@/lib/statuses";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { FileUpload, type PickedFile } from "@/components/FileUpload";
import toast from "react-hot-toast";
import type { Profile, Application } from "@/lib/types";

type Tab = "home" | "apply" | "status" | "chat" | "profile";

interface AppForm {
  purpose: string;
  university_name: string;
  date_from: string;
  date_to: string;
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

  // Форма заявки
  const [appForm, setAppForm] = useState<AppForm>({ purpose: "", university_name: "", date_from: "", date_to: "" });
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [sending, setSending] = useState(false);

  // Профиль
  const [profileForm, setProfileForm] = useState({ name: "", group_name: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Чат
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Сәлеметсіз бе! 👋 Я ИИ-ассистент университета. Спросите о мобильности, документах или заявках." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      // Сессия в httpOnly-cookie; профиль берём из profiles (middleware уже проверил вход)
      const profile = await getProfile();
      if (!profile) { router.push("/auth"); return; }
      setStudent(profile);
      setProfileForm({ name: profile.name, group_name: profile.group_name ?? "" });
      setAvatarUrl(profile.avatar_url);

      const { data } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setApps(data as Application[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Отправка заявки: файлы уезжают в Storage, в БД — только пути
  const sendApplication = async () => {
    if (!student) return;
    if (!appForm.purpose.trim()) { toast.error("Укажите цель поездки"); return; }
    if (!appForm.university_name.trim()) { toast.error("Укажите университет назначения"); return; }
    if (!appForm.date_from || !appForm.date_to) { toast.error("Укажите сроки поездки"); return; }
    if (appForm.date_from > appForm.date_to) { toast.error("Дата начала позже даты конца"); return; }
    if (files.length === 0) { toast.error("Прикрепите документы"); return; }

    setSending(true);
    const appId = crypto.randomUUID();
    const uploaded = await uploadDocuments(student.id, appId, files.map((f) => f.file));

    if ("error" in uploaded) { toast.error(uploaded.error); setSending(false); return; }

    const { error } = await supabase.from("applications").insert({
      id: appId,
      student_id: student.id,
      student_name: student.name,
      student_email: student.email,
      university_name: appForm.university_name.trim(),
      purpose: appForm.purpose.trim(),
      date_from: appForm.date_from,
      date_to: appForm.date_to,
      status: STATUS.FACULTY_REVIEW,
      file_names: uploaded.names,
      file_paths: uploaded.paths,
    });

    if (error) { toast.error("Ошибка отправки заявки"); setSending(false); return; }

    toast.success("Заявка отправлена! Отслеживайте статус 🎉");
    setFiles([]);
    setAppForm({ purpose: "", university_name: "", date_from: "", date_to: "" });
    setActiveTab("status");

    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    if (data) setApps(data as Application[]);
    setSending(false);
  };

  // Сохранение профиля: данные + аватар в Storage
  const saveProfile = async () => {
    if (!student) return;
    if (!profileForm.name.trim()) { toast.error("Имя не может быть пустым"); return; }

    setSavingProfile(true);
    let newAvatar = avatarUrl;

    const picked = avatarInputRef.current?.files?.[0];
    if (picked) {
      newAvatar = await uploadAvatar(student.id, picked);
      if (!newAvatar) toast.error("Аватар не загрузился, но данные сохранятся");
    }

    const { error } = await supabase.from("profiles").update({
      name: profileForm.name.trim(),
      group_name: profileForm.group_name.trim() || null,
      avatar_url: newAvatar,
    }).eq("id", student.id);

    if (error) { toast.error("Ошибка сохранения"); setSavingProfile(false); return; }

    const updated = { ...student, name: profileForm.name.trim(), group_name: profileForm.group_name, avatar_url: newAvatar };
    setStudent(updated);
    setAvatarUrl(newAvatar);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setSavingProfile(false);
    toast.success("Профиль обновлён! ✅");
  };

  const sendChat = async () => {
    const text = chatInput.trim().slice(0, 2000);
    if (!text || chatLoading) return;

    const history = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages([...history, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setChatMessages([...history, { role: "assistant", content: acc }]);
      }
    } catch {
      toast.error("Ошибка связи с ИИ");
      setChatMessages([...history, { role: "assistant", content: "⚠️ Не удалось получить ответ." }]);
    } finally {
      setChatLoading(false);
    }
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
              {avatarUrl
                ? <img src={avatarUrl} alt="Аватар" className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-xl font-bold">{student.name?.[0] ?? "?"}</div>}
            </div>
            <div className="mt-3 text-sm font-semibold group-hover:underline">{student.name}</div>
            <div className="text-[11px] text-blue-300">{student.group_name || student.email}</div>
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition ${
                activeTab === tab.id ? "bg-white/15 font-semibold" : "hover:bg-white/8"
              }`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3">
          <button onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl border border-white/20 px-4 py-2.5 text-sm text-blue-200 transition hover:bg-white/10">
            <LogOut size={15} /> Выйти
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {/* Мобильная нижняя навигация */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[color:var(--border)] bg-[color:var(--card)] md:hidden">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
                activeTab === tab.id ? "font-bold text-blue-600" : "text-slate-400"
              }`}>
              <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          {/* Главная */}
          {activeTab === "home" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-600 p-6 text-white shadow-lg">
                <h1 className="text-lg font-bold">Сәлеметсіз бе, {student.name.split(" ")[0]}! 👋</h1>
                <p className="mt-1 text-sm text-blue-100">
                  Платформа академической мобильности АРСУ. Подайте заявку и следите за её статусом.
                </p>
                <button onClick={() => setActiveTab("apply")}
                  className="mt-4 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25">
                  📤 Подать заявку
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button onClick={() => setActiveTab("status")} className="card rounded-2xl p-4 text-left shadow-sm transition hover:border-blue-400">
                  <div className="text-2xl font-bold text-blue-600">{apps.length}</div>
                  <div className="mt-1 text-xs text-slate-500">Мои заявки</div>
                </button>
                <button onClick={() => setActiveTab("chat")} className="card rounded-2xl p-4 text-left shadow-sm transition hover:border-blue-400">
                  <div className="text-2xl font-bold text-indigo-600">🤖</div>
                  <div className="mt-1 text-xs text-slate-500">Спросить ИИ-ассистента</div>
                </button>
                <button onClick={() => setActiveTab("profile")} className="card rounded-2xl p-4 text-left shadow-sm transition hover:border-blue-400">
                  <div className="text-2xl font-bold text-teal-600">👤</div>
                  <div className="mt-1 text-xs text-slate-500">Заполнить профиль</div>
                </button>
              </div>

              {apps[0] && (
                <div className="card rounded-2xl p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold text-slate-500">Последняя заявка</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{apps[0].university_name}</span>
                    <StatusBadge status={apps[0].status} />
                  </div>
                  <div className="mt-3"><StatusTimeline status={apps[0].status} /></div>
                </div>
              )}
            </div>
          )}

          {/* Подача заявки */}
          {activeTab === "apply" && (
            <div className="card rounded-2xl p-5 shadow-sm">
              <h1 className="text-base font-bold">📤 Новая заявка на мобильность</h1>
              <p className="mt-1 text-xs text-slate-500">
                Заявка уйдёт на проверку факультету, далее — департаменту.
              </p>

              <div className="mt-4 space-y-3">
                <input value={appForm.university_name} onChange={(e) => setAppForm({ ...appForm, university_name: e.target.value })}
                  placeholder="Университет назначения *" className={inputClass} />
                <textarea value={appForm.purpose} onChange={(e) => setAppForm({ ...appForm, purpose: e.target.value })}
                  placeholder="Цель поездки (обучение по программе, кредиты…) *" rows={3}
                  className={`${inputClass} resize-none`} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-slate-500">
                    Начало *
                    <input type="date" value={appForm.date_from} onChange={(e) => setAppForm({ ...appForm, date_from: e.target.value })}
                      className={`${inputClass} mt-1`} />
                  </label>
                  <label className="text-xs text-slate-500">
                    Конец *
                    <input type="date" value={appForm.date_to} onChange={(e) => setAppForm({ ...appForm, date_to: e.target.value })}
                      className={`${inputClass} mt-1`} />
                  </label>
                </div>

                <FileUpload files={files} setFiles={setFiles} />

                <button onClick={sendApplication} disabled={sending}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60">
                  {sending ? "⏳ Отправляем…" : "Отправить заявку"}
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
                  Заявок пока нет. <button onClick={() => setActiveTab("apply")} className="text-blue-600 hover:underline">Подать первую →</button>
                </div>
              ) : (
                apps.map((app) => (
                  <article key={app.id} className="card rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{app.university_name}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      📅 {new Date(app.date_from).toLocaleDateString("ru-RU")} — {new Date(app.date_to).toLocaleDateString("ru-RU")} · подана {new Date(app.created_at).toLocaleDateString("ru-RU")}
                    </div>
                    <div className="mt-3"><StatusTimeline status={app.status} /></div>
                    {(app.status === STATUS.REJECTED || app.status === STATUS.FACULTY_REJECTED) &&
                      (app.dept_comment || app.faculty_comment) && (
                        <div className="mt-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                          💬 Причина: {app.dept_comment || app.faculty_comment}
                        </div>
                      )}
                    {app.file_names.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {app.file_names.map((name, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                            <FileText size={10} /> {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))
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
                  <div className="text-[11px] text-slate-400">Отвечает на вопросы о мобильности</div>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4 no-scrollbar">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                        <Bot size={14} />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      m.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "card rounded-bl-md"
                    }`}>
                      {m.content}
                      {chatLoading && m.role === "assistant" && m.content === "" && (
                        <span className="inline-flex animate-pulse gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        </span>
                      )}
                    </div>
                    {m.role === "user" && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-300 text-slate-600">
                        <UserIcon size={14} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-end gap-2 border-t border-[color:var(--border)] p-3">
                <textarea rows={1} value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Спросите что-нибудь…"
                  className="max-h-32 flex-1 resize-none rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none no-scrollbar" />
                <button onClick={sendChat} disabled={chatLoading} aria-label="Отправить"
                  className="rounded-xl bg-blue-600 p-2.5 text-white transition hover:bg-blue-700 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Профиль */}
          {activeTab === "profile" && (
            <div className="card rounded-2xl p-5 shadow-sm">
              <h1 className="text-base font-bold">👤 Мой профиль</h1>

              {/* Аватар */}
              <div className="mt-4 flex items-center gap-4">
                <button onClick={() => avatarInputRef.current?.click()} className="group relative" aria-label="Сменить аватар">
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-200 shadow-md">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Аватар" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-500">{student.name?.[0] ?? "?"}</div>}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow transition group-hover:bg-blue-700">
                    <Camera size={13} />
                  </div>
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={() => saveProfile()} />
                <div className="text-xs text-slate-500">
                  <div className="font-medium text-slate-700">{student.email}</div>
                  <div className="mt-0.5">Нажмите на аватар, чтобы сменить фото</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="ФИО *" className={inputClass} />
                <input value={profileForm.group_name} onChange={(e) => setProfileForm({ ...profileForm, group_name: e.target.value })}
                  placeholder="Группа (например IT-202)" className={inputClass} />
                <button onClick={saveProfile} disabled={savingProfile}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60">
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