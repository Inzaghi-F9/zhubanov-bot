"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [formData, setFormData] = useState({ email: "", password: "", name: "", group: "IT-202" });
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (mode === "login") {
        // Проверяем сначала — не админ ли это (старая система)
        const { data: adminData } = await supabase
          .from("users")
          .select("*")
          .eq("login", formData.email)
          .eq("password", formData.password)
          .eq("role", "admin")
          .single();

        if (adminData) {
          localStorage.setItem("current_session", JSON.stringify(adminData));
          router.push("/admin");
          return;
        }

        // Обычный вход через Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) { toast.error("Неверный email или пароль"); return; }

        // Получаем профиль из нашей таблицы
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("email", formData.email)
          .single();

        if (profile) {
          localStorage.setItem("current_session", JSON.stringify({ ...profile, supabase_id: data.user.id }));
          if (profile.role === "faculty") router.push("/faculty");
else router.push("/dashboard");
        } else {
          toast.error("Профиль не найден. Обратитесь к администратору.");
        }

      } else if (mode === "register") {
        if (!formData.email || !formData.password || !formData.name) {
          toast.error("Заполните все поля");
          return;
        }

        // Регистрация через Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) { toast.error("Ошибка: " + error.message); return; }

        // Создаём профиль в нашей таблице
        const { error: profileError } = await supabase.from("users").insert([{
          login: formData.email,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          group_name: formData.group,
          role: "student"
        }]);

        if (profileError) { toast.error("Логин уже занят"); return; }

        toast.success("Регистрация успешна! Теперь войдите.");
        setMode("login");

      } else if (mode === "reset") {
        // Сброс пароля
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: "https://zhubanov-bot-829u.vercel.app/auth/reset",
        });

        if (error) { toast.error("Ошибка: " + error.message); return; }
        setResetSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', fontFamily: "'Inter', sans-serif", padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px' }}>
        
        {/* Лого */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎓</div>
          <h2 style={{ color: '#1e293b', margin: 0, fontSize: '22px', fontWeight: '700' }}>
            {mode === 'login' ? 'Вход в ARSU' : mode === 'register' ? 'Регистрация' : 'Сброс пароля'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Университет им. К. Жубанова</p>
        </div>

        {resetSent ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h3 style={{ color: '#1e293b' }}>Письмо отправлено!</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Проверьте почту {formData.email} и перейдите по ссылке для сброса пароля.</p>
            <button onClick={() => { setResetSent(false); setMode('login'); }}
              style={{ marginTop: '20px', padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
              Вернуться к входу
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'register' && (
              <input placeholder="ФИО студента" value={formData.name}
                style={{ padding: '13px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none' }}
                onChange={(e) => setFormData({...formData, name: e.target.value})} />
            )}
            {mode === 'register' && (
              <input placeholder="Группа (например IT-202)" value={formData.group}
  style={{ padding: '13px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none' }}
  onChange={(e) => setFormData({...formData, group: e.target.value})} />
            )}
            <input placeholder={mode === 'login' ? 'Email' : 'Email'} value={formData.email}
              style={{ padding: '13px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none' }}
              onChange={(e) => setFormData({...formData, email: e.target.value})} />
            {mode !== 'reset' && (
              <input type="password" placeholder="Пароль" value={formData.password}
                style={{ padding: '13px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none' }}
                onChange={(e) => setFormData({...formData, password: e.target.value})} />
            )}

            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                <span onClick={() => setMode('reset')} style={{ color: '#2563eb', fontSize: '13px', cursor: 'pointer' }}>
                  Забыли пароль?
                </span>
              </div>
            )}

            <button onClick={handleAuth} disabled={loading}
              style={{ padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}>
              {loading ? "⏳ Загрузка..." : mode === 'login' ? 'Войти' : mode === 'register' ? 'Создать аккаунт' : 'Отправить письмо'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              {mode === 'login' ? (
                <span onClick={() => setMode('register')} style={{ color: '#2563eb', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                  Нет аккаунта? Зарегистрироваться
                </span>
              ) : (
                <span onClick={() => setMode('login')} style={{ color: '#2563eb', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                  Уже есть аккаунт? Войти
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}