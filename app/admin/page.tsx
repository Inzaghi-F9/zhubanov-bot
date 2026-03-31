"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [apps, setApps] = useState<any[]>([]);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("все");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const session = localStorage.getItem("current_session");
    if (!session) { router.push("/auth"); return; }
    const s = JSON.parse(session);
    if (s.role !== "admin") { router.push("/dashboard"); return; }
    loadApps();
  }, []);

  const loadApps = async () => {
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    if (data) setApps(data);
  };

  const update = async (id: string, status: string, comment: string = "") => {
  await supabase.from("applications").update({ status, comment }).eq("id", id);

  // Находим email студента и отправляем уведомление
  const app = apps.find(a => a.id === id);
  if (app?.student_login) {
    const { data: user } = await supabase
      .from("users")
      .select("email, name")
      .eq("login", app.student_login)
      .single();

    if (user?.email) {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail: user.email,
          studentName: user.name,
          status,
          comment,
        }),
      });
    }
  }

  setCommentId(null); setText(""); loadApps();
};


  const filtered = filter === "все" ? apps : apps.filter(a => a.status === filter);
  const counts = {
    все: apps.length,
    "На проверке": apps.filter(a => a.status === "На проверке").length,
    "Принято": apps.filter(a => a.status === "Принято").length,
    "Ошибка": apps.filter(a => a.status === "Ошибка").length,
  };

  const statusColor = (s: string) => s === 'Принято' ? '#22c55e' : s === 'Ошибка' ? '#ef4444' : '#f59e0b';
  const statusBg = (s: string) => s === 'Принято' ? '#dcfce7' : s === 'Ошибка' ? '#fee2e2' : '#fef9c3';
  const statusText = (s: string) => s === 'Принято' ? '#16a34a' : s === 'Ошибка' ? '#dc2626' : '#ca8a04';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: isMobile ? '0 16px' : '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', height: '60px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '20px' }}>🎓</div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: isMobile ? '14px' : '16px' }}>ARSU Admin</div>
            {!isMobile && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Панель управления заявками</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadApps} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>🔄</button>
          <button onClick={() => { localStorage.removeItem("current_session"); router.push("/auth"); }}
            style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            Выйти
          </button>
        </div>
      </div>

      <div style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Всего', value: counts['все'], color: '#2563eb', icon: '📋' },
            { label: 'На проверке', value: counts['На проверке'], color: '#d97706', icon: '⏳' },
            { label: 'Принято', value: counts['Принято'], color: '#16a34a', icon: '✅' },
            { label: 'С ошибкой', value: counts['Ошибка'], color: '#dc2626', icon: '❌' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ color: stat.color, fontSize: '28px', fontWeight: '700' }}>{stat.value}</div>
                </div>
                <div style={{ fontSize: '24px' }}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['все', 'На проверке', 'Принято', 'Ошибка'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', background: filter === f ? '#2563eb' : 'white', color: filter === f ? 'white' : '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {f === 'все' ? 'Все' : f} ({counts[f as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>

        {/* Список заявок */}
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ color: '#64748b' }}>Заявок нет</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(app => (
              <div key={app.id} style={{ background: 'white', borderRadius: '14px', padding: isMobile ? '16px' : '20px 24px', border: '1px solid #e5e7eb', borderLeft: `5px solid ${statusColor(app.status)}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

                {/* Верхняя часть — студент + статус */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>
                    {app.student_name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{app.student_name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{app.student_login} · {new Date(app.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: statusBg(app.status), color: statusText(app.status), flexShrink: 0 }}>
                    {app.status}
                  </span>
                </div>

                {/* Файлы */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {app.file_names?.map((name: string, i: number) => (
                    <a key={i} href={app.file_urls[i]} download={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#0369a1', fontSize: '12px', textDecoration: 'none' }}>
                      💾 {name}
                    </a>
                  ))}
                </div>

                {app.comment && (
                  <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                    💬 {app.comment}
                  </div>
                )}

                {/* Действия */}
                {commentId === app.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input value={text} onChange={e => setText(e.target.value)} placeholder="Причина ошибки..."
                      style={{ padding: '10px 12px', border: '1px solid #fca5a5', borderRadius: '8px', color: '#1e293b', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => update(app.id, "Ошибка", text)} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Отправить</button>
                      <button onClick={() => setCommentId(null)} style={{ flex: 1, background: '#e2e8f0', color: '#64748b', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => update(app.id, "Принято")} style={{ flex: 1, background: '#22c55e', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✓ Принять</button>
                    <button onClick={() => setCommentId(app.id)} style={{ flex: 1, background: '#f59e0b', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✗ Ошибка</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}