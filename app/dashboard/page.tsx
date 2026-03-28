"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("menu");
  const [files, setFiles] = useState<{name: string, data: string}[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:string,content:string}[]>([
    {role:"assistant", content:"Сәлеметсіз бе! Я ИИ-ассистент университета им. К. Жубанова. Чем могу помочь?"}
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("current_session");
    if (!session) { router.push("/auth"); return; }
    const s = JSON.parse(session);
    setStudent(s);
    loadApps(s.login);
  }, []);

  const loadApps = async (login: string) => {
    const { data } = await supabase.from("applications").select("*").eq("student_login", login).order("created_at", { ascending: false });
    if (data) setApps(data);
  };

  const handleFile = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFiles(prev => [...prev, { name: file.name, data: reader.result as string }]);
    reader.readAsDataURL(file);
  };

  const sendDoc = async () => {
    if (files.length === 0) return alert("Прикрепите файлы");
    setLoading(true);
    const { error } = await supabase.from("applications").insert([{
      student_name: student.name, student_login: student.login,
      file_names: files.map(f => f.name), file_urls: files.map(f => f.data),
      status: "На проверке", comment: ""
    }]);
    setLoading(false);
    if (error) { alert("Ошибка отправки"); return; }
    alert("Документы отправлены!");
    setFiles([]); setActiveTab("status"); loadApps(student.login);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ messages: updated }) });
      const data = await res.json();
      setChatMessages([...updated, { role: "assistant", content: data.text }]);
    } catch { setChatMessages([...updated, { role: "assistant", content: "Ошибка связи. Попробуйте позже." }]); }
    finally { setChatLoading(false); }
  };

  if (!student) return null;

  const navItems = [
    { id: "menu", icon: "🏠", label: "Главная" },
    { id: "chat", icon: "🤖", label: "ИИ-ассистент" },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: 'linear-gradient(180deg, #1e3a5f 0%, #2563eb 100%)', display: 'flex', flexDirection: 'column', padding: '0', boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold', color: 'white', margin: '0 auto' }}>{student.name?.[0]}</div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{student.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '3px' }}>{student.login}</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ width: '100%', padding: '12px 16px', marginBottom: '6px', border: 'none', borderRadius: '10px', background: activeTab === item.id ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', fontWeight: activeTab === item.id ? '600' : '400', fontSize: '14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 12px' }}>
          <button onClick={() => { localStorage.removeItem("current_session"); router.push("/auth"); }} style={{ width: '100%', padding: '11px', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', borderRadius: '10px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px' }}>
            Выйти
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'white', padding: '18px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h1 style={{ color: '#1e293b', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {activeTab === 'menu' ? '🏠 Главная' : activeTab === 'chat' ? '🤖 ИИ-ассистент' : activeTab === 'submit' ? '📤 Подать документы' : '🕒 Мои заявки'}
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Университет им. К. Жубанова</div>
        </div>

        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* ГЛАВНАЯ */}
          {activeTab === "menu" && (
            <div>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '15px' }}>Добро пожаловать, <strong>{student.name}</strong>! Выберите действие:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', maxWidth: '900px' }}>
                {[
                  { id: 'submit', icon: '📤', title: 'Подать документы', desc: 'Загрузить файлы для деканата', color: '#2563eb' },
                  { id: 'status', icon: '🕒', title: 'Мои заявки', desc: `Активных заявок: ${apps.length}`, color: '#7c3aed' },
                  { id: 'chat', icon: '🤖', title: 'ИИ-ассистент', desc: 'Задать вопрос нейросети', color: '#059669' },
                ].map(card => (
                  <div key={card.id} onClick={() => { setActiveTab(card.id); if(card.id==='status') loadApps(student.login); }} style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b', marginBottom: '6px' }}>{card.title}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{card.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ПОДАТЬ ДОКУМЕНТЫ */}
          {activeTab === "submit" && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                <h2 style={{ color: '#1e293b', marginBottom: '8px', fontSize: '20px' }}>Загрузка документов</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Прикрепите необходимые файлы и отправьте в деканат</p>
                
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
                  <span style={{ fontSize: '32px' }}>📁</span>
                  <div>
                    <div style={{ color: '#2563eb', fontWeight: '600', fontSize: '15px' }}>Нажмите чтобы выбрать файл</div>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>PDF, DOCX, JPG и другие</div>
                  </div>
                  <input type="file" onChange={handleFile} style={{ display: 'none' }} />
                </label>

                {files.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    {files.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', marginBottom: '8px' }}>
                        <span style={{ color: '#0369a1', fontSize: '14px' }}>📄 {f.name}</span>
                        <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={sendDoc} disabled={loading || files.length === 0} style={{ width: '100%', padding: '14px', background: files.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: files.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  {loading ? "⏳ Отправляем..." : files.length === 0 ? "Сначала выберите файлы" : `📤 Отправить ${files.length} файл(а) в деканат`}
                </button>
              </div>
            </div>
          )}

          {/* МОИ ЗАЯВКИ */}
          {activeTab === "status" && (
            <div style={{ maxWidth: '700px' }}>
              <h2 style={{ color: '#1e293b', marginBottom: '20px', fontSize: '20px' }}>Мои заявки</h2>
              {apps.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                  <div style={{ color: '#64748b', fontSize: '15px' }}>Заявок пока нет</div>
                </div>
              ) : apps.map(app => (
                <div key={app.id} style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '12px', border: '1px solid #e5e7eb', borderLeft: `5px solid ${app.status === 'Принято' ? '#22c55e' : app.status === 'Ошибка' ? '#ef4444' : '#f59e0b'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: app.status === 'Принято' ? '#dcfce7' : app.status === 'Ошибка' ? '#fee2e2' : '#fef9c3', color: app.status === 'Принято' ? '#16a34a' : app.status === 'Ошибка' ? '#dc2626' : '#ca8a04' }}>{app.status}</span>
                      <div style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>Файлы: {app.file_names?.join(", ")}</div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(app.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>
                  {app.comment && <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>💬 {app.comment}</div>}
                </div>
              ))}
            </div>
          )}

          {/* ЧАТ */}
          {activeTab === "chat" && (
            <div style={{ maxWidth: '720px', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>🤖 ИИ-ассистент Жубанова</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Отвечает на вопросы об университете</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f1f5f9', color: m.role === 'user' ? 'white' : '#1e293b', fontSize: '14px', lineHeight: '1.5' }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '18px 18px 18px 4px', color: '#64748b', fontSize: '14px' }}>⏳ Думаю...</div></div>}
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Напишите вопрос..." style={{ flex: 1, padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                  <button onClick={sendChat} disabled={chatLoading} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                    ➤
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}