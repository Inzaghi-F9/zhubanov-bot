"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ login: "", password: "", name: "", group: "IT-202" });
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        // Вход
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("login", formData.login)
          .eq("password", formData.password)
          .single();

        if (error || !data) { alert("Неверный логин или пароль"); return; }

        localStorage.setItem("current_session", JSON.stringify(data));
        router.push(data.role === "admin" ? "/admin" : "/dashboard");
      } else {
        // Регистрация
        if (!formData.login || !formData.password || !formData.name) return alert("Заполните все поля");

        const { error } = await supabase.from("users").insert([{
          login: formData.login,
          password: formData.password,
          name: formData.name,
          group_name: formData.group,
          role: "student"
        }]);

        if (error) { alert("Логин уже занят"); return; }
        alert("Регистрация успешна! Теперь войдите.");
        setIsLogin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '380px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: 'black' }}>
          {isLogin ? "Вход в ARSU" : "Регистрация студента"}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <input placeholder="ФИО студента" style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', color: 'black' }}
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
          )}
          <input placeholder="Логин" style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', color: 'black' }}
            onChange={(e) => setFormData({...formData, login: e.target.value})} />
          <input type="password" placeholder="Пароль" style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', color: 'black' }}
            onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button onClick={handleAuth} disabled={loading}
            style={{ padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
        <p onClick={() => setIsLogin(!isLogin)} style={{ textAlign: 'center', color: '#2563eb', cursor: 'pointer', marginTop: '20px', fontSize: '14px', textDecoration: 'underline' }}>
          {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </p>
      </div>
    </div>
  );
}