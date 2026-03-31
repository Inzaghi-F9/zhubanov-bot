"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase автоматически обрабатывает токен из URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Пользователь перешёл по ссылке из письма — можно менять пароль
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || password.length < 6) { alert("Пароль минимум 6 символов"); return; }
    if (password !== confirm) { alert("Пароли не совпадают"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) { alert("Ошибка: " + error.message); setLoading(false); return; }

    // Обновляем пароль и в нашей таблице users
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.from("users").update({ password }).eq("email", user.email);
    }

    setLoading(false);
    setDone(true);
    setTimeout(() => router.push("/auth"), 3000);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', fontFamily: "'Inter', sans-serif", padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔐</div>
          <h2 style={{ color: '#1e293b', margin: 0, fontSize: '22px', fontWeight: '700' }}>Новый пароль</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Придумайте новый пароль</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#16a34a' }}>Пароль изменён!</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Перенаправляем на страницу входа...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="password" placeholder="Новый пароль" value={password}
              style={{ padding: '13px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none' }}
              onChange={(e) => setPassword(e.target.value)} />
            <input type="password" placeholder="Повторите пароль" value={confirm}
              style={{ padding: '13px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none' }}
              onChange={(e) => setConfirm(e.target.value)} />
            <button onClick={handleReset} disabled={loading}
              style={{ padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? "⏳ Сохраняем..." : "Сохранить пароль"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}