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
    setCommentId(null); setText(""); loadApps();
  };

  const filtered = filter === "все" ? apps : apps.filter(a => a.status === filter);
  const counts = {
    все: apps.length,
    "На проверке": apps.filter(a => a.status === "На проверке").length,
    "Принято": apps.filter(a => a.status === "Принято").length,
    "Ошибка": apps.filter(a => a.status === "Ошибка").length,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>🎓</div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>ARSU Admin</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Панель управления заявками</div>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("current_session"); router.push("/auth"); }}
          style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          Выйти
        </button>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Всего заявок', value: counts['все'], color: '#2563eb', bg: '#eff6ff', icon: '📋' },
            { label: 'На проверке', value: counts['На проверке'], color: '#d97706', bg: '#fffbeb', icon: '⏳' },
            { label: 'Принято', value: counts['Принято'], color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
            { label: 'С ошибкой', value: counts['Ошибка'], color: '#dc2626', bg: '#fef2f2', icon: '❌' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '6px' }}>{stat.label}</div>
                  <div style={{ color: stat.color, fontSize: '32px', fontWeight: '700' }}>{stat.value}</div>
                </div>
                <div style={{ fontSize: '28px' }}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['все', 'На проверке', 'Принято', 'Ошибка'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: filter === f ? '#2563eb' : 'white', color: filter === f ? 'white' : '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}>
              {f === 'все' ? 'Все' : f} ({counts[f as keyof typeof counts] ?? 0})
            </button>
          ))}
          <button onClick={loadApps} style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: '20px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '13px', background: 'white', color: '#64748b' }}>
            🔄 Обновить
          </button>
        </div>

        {/* Список заявок */}
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ color: '#64748b', fontSize: '15px' }}>Заявок нет</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(app => (
              <div key={app.id} style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e5e7eb', borderLeft: `5px solid ${app.status === 'Принято' ? '#22c55e' : app.status === 'Ошибка' ? '#ef4444' : '#f59e0b'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                
                {/* Аватар */}
                <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '18px', flexShrink: 0 }}>
                  {app.student_name?.[0]}
                </div>

                {/* Инфо студента */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{app.student_name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{app.student_login} · {new Date(app.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {app.file_names?.map((name: string, i: number) => (
                      <a key={i} href={app.file_urls[i]} download={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', color: '#0369a1', fontSize: '12px', textDecoration: 'none' }}>
                        💾 {name}
                      </a>
                    ))}
                  </div>
                  {app.comment && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
                      💬 {app.comment}
                    </div>
                  )}
                </div>

                {/* Статус */}
                <div style={{ flexShrink: 0 }}>
                  <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: app.status === 'Принято' ? '#dcfce7' : app.status === 'Ошибка' ? '#fee2e2' : '#fef9c3', color: app.status === 'Принято' ? '#16a34a' : app.status === 'Ошибка' ? '#dc2626' : '#ca8a04' }}>
                    {app.status}
                  </span>
                </div>

                {/* Действия */}
                <div style={{ flexShrink: 0 }}>
                  {commentId === app.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '220px' }}>
                      <input value={text} onChange={e => setText(e.target.value)} placeholder="Причина ошибки..."
                        style={{ padding: '9px 12px', border: '1px solid #fca5a5', borderRadius: '8px', color: '#1e293b', fontSize: '13px', outline: 'none' }} />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => update(app.id, "Ошибка", text)} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Отправить</button>
                        <button onClick={() => setCommentId(null)} style={{ flex: 1, background: '#e2e8f0', color: '#64748b', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => update(app.id, "Принято")} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✓ Принять</button>
                      <button onClick={() => setCommentId(app.id)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✗ Ошибка</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}