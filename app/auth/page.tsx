"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Mail, Lock, User as UserIcon, ArrowRight, Building2, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FACULTIES } from "@/lib/types";
import toast from "react-hot-toast";

type Mode = "login" | "register" | "reset";

const homeFor = (role: string | undefined) =>
  role === "admin" ? "/admin" : role === "faculty" ? "/faculty" : "/dashboard";

// useSearchParams требует Suspense-границу при статическом рендере
export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

// Единая авторизация Supabase Auth: профиль с ролью создаёт триггер on_auth_user_created
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    group: "IT-202",
    faculty: FACULTIES[0] as string,
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const set = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [key]: e.target.value });

  const handleAuth = async () => {
    const { email, password, name } = formData;
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          toast.error("Заполните email и пароль");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Неверный email или пароль");
          return;
        }
        // Роль из profiles; middleware дополнительно проверит на сервере
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", (await supabase.auth.getUser()).data.user!.id)
          .single();

        toast.success("Добро пожаловать!");
        router.push(next ?? homeFor(profile?.role));
        router.refresh();

      } else if (mode === "register") {
        if (!email || !password || !name) {
          toast.error("Заполните все поля");
          return;
        }
        if (password.length < 6) {
          toast.error("Пароль минимум 6 символов");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              group_name: formData.group,
              faculty: formData.faculty,
              phone: formData.phone,
            }, // попадёт в профиль триггером
          },
        });
        if (error) {
          toast.error("Ошибка: " + error.message);
          return;
        }
        toast.success("Аккаунт создан! Теперь войдите.");
        setMode("login");

      } else {
        if (!email) {
          toast.error("Укажите email");
          return;
        }
        const siteUrl = window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/auth/reset`,
        });
        if (error) {
          toast.error("Ошибка: " + error.message);
          return;
        }
        setResetSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "card w-full rounded-xl px-11 py-3 text-sm outline-none focus:border-blue-500 transition placeholder:text-slate-400";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-5">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="mb-6 text-center text-white">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-xl font-bold">Университет им. К. Жубанова</h1>
          <p className="mt-1 text-sm text-blue-200/70">Платформа академической мобильности</p>
        </div>

        <div className="card rounded-3xl p-7 shadow-2xl">
          {resetSent ? (
            <div className="text-center">
              <div className="mb-3 text-4xl">📧</div>
              <h2 className="text-lg font-bold">Письмо отправлено!</h2>
              <p className="mt-2 text-sm text-slate-500">
                Проверьте почту {formData.email} и перейдите по ссылке для смены пароля.
              </p>
              <button
                onClick={() => { setResetSent(false); setMode("login"); }}
                className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Вернуться к входу
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="mb-1 text-center text-lg font-bold">
                {mode === "login" ? "Вход" : mode === "register" ? "Регистрация" : "Восстановление пароля"}
              </h2>

              {mode === "register" && (
                <>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input placeholder="ФИО студента *" value={formData.name} onChange={set("name")} className={inputClass} />
                  </div>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={formData.faculty} onChange={set("faculty")} className={inputClass}>
                      {FACULTIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Группа (IT-202)"
                      value={formData.group}
                      onChange={set("group")}
                      className="card w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition placeholder:text-slate-400"
                    />
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        placeholder="+7 700..."
                        value={formData.phone}
                        onChange={set("phone")}
                        className="card w-full rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-blue-500 transition placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input placeholder="Email" type="email" value={formData.email} onChange={set("email")} className={inputClass} />
              </div>

              {mode !== "reset" && (
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input placeholder="Пароль" type="password" value={formData.password} onChange={set("password")} className={inputClass} />
                </div>
              )}

              {mode === "login" && (
                <div className="text-right">
                  <button onClick={() => setMode("reset")} className="text-xs text-blue-600 hover:underline">
                    Забыли пароль?
                  </button>
                </div>
              )}

              <button
                onClick={handleAuth}
                disabled={loading}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {loading
                  ? "⏳ Загрузка…"
                  : mode === "login"
                    ? <>Войти <ArrowRight size={15} /></>
                    : mode === "register"
                      ? "Создать аккаунт"
                      : "Отправить письмо"}
              </button>

              <div className="mt-1 text-center">
                {mode !== "register" ? (
                  <button onClick={() => setMode("register")} className="text-xs text-blue-600 hover:underline">
                    Нет аккаунта? Зарегистрироваться
                  </button>
                ) : (
                  <button onClick={() => setMode("login")} className="text-xs text-blue-600 hover:underline">
                    Уже есть аккаунт? Войти
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-blue-200/50">
          Пароли хранятся зашифрованными — безопасность обеспечивает Supabase Auth
        </p>
      </div>
    </div>
  );
}