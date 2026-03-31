"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
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
  const chatEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [chatMessages]);
  const [isMobile, setIsMobile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", group_name: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setStudent(s);
    setProfileForm({ name: s.name || "", group_name: s.group_name || "" });
    setAvatarUrl(s.avatar_url || null);
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

  const handleAvatar = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error("Имя не может быть пустым"); return; }
    setProfileLoading(true);
    const { error } = await supabase.from("users").update({
      name: profileForm.name,
      group_name: profileForm.group_name,
      avatar_url: avatarUrl,
    }).eq("login", student.login);

    if (error) { toast.error("Ошибка сохранения"); setProfileLoading(false); return; }

    const updated = { ...student, name: profileForm.name, group_name: profileForm.group_name, avatar_url: avatarUrl };
    setStudent(updated);
    localStorage.setItem("current_session", JSON.stringify(updated));
    setProfileLoading(false);
    toast.success("Профиль обновлён! ✅");
  };

  const sendDoc = async () => {
    if (files.length === 0) return toast.error("Прикрепите файлы");
    setLoading(true);
    const { error } = await supabase.from("applications").insert([{
      student_name: student.name, student_login: student.login,
      file_names: files.map(f => f.name), file_urls: files.map(f => f.data),
      status: "На проверке", comment: ""
    }]);
    setLoading(false);
    if (error) { toast.error("Ошибка отправки"); return; }
    toast.success("Документы отправлены!")
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
    } catch { setChatMessages([...updated, { role: "assistant", content: "Ошибка связи." }]); }
    finally { setChatLoading(false); }
  };

  if (!student) return null;

  const navItems = [
    { id: "menu", icon: "🏠", label: "Главная" },
    { id: "submit", icon: "📤", label: "Подать" },
    { id: "status", icon: "🕒", label: "Заявки" },
    { id: "chat", icon: "🤖", label: "ИИ" },
    { id: "profile", icon: "👤", label: "Профиль" },
  ];

  const statusColor = (s: string) => s === 'Принято' ? '#22c55e' : s === 'Ошибка' ? '#ef4444' : '#f59e0b';
  const statusBg = (s: string) => s === 'Принято' ? '#dcfce7' : s === 'Ошибка' ? '#fee2e2' : '#fef9c3';
  const statusText = (s: string) => s === 'Принято' ? '#16a34a' : s === 'Ошибка' ? '#dc2626' : '#ca8a04';

  const Avatar = ({ size = 56 }: { size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: 'white', fontWeight: '700', fontSize: size * 0.4 }}>{student.name?.[0]}</span>
      )}
    </div>
  );

  const mainContent = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f4f8' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: isMobile ? '14px 16px' : '18px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
        <h1 style={{ color: '#1e293b', fontSize: isMobile ? '16px' : '18px', fontWeight: '700', margin: 0 }}>
          {activeTab === 'menu' ? '🏠 Главная' : activeTab === 'chat' ? '🤖 ИИ-ассистент' : activeTab === 'submit' ? '📤 Подать документы' : activeTab === 'status' ? '🕒 Мои заявки' : '👤 Профиль'}
        </h1>
        {isMobile && (
          <div onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{student.name?.[0]}</span>}
            </div>
          </div>
        )}
        {!isMobile && <div style={{ fontSize: '13px', color: '#64748b' }}>Университет им. К. Жубанова</div>}
      </div>

      <div style={{ flex: 1, padding: isMobile ? '16px' : '28px 32px', overflowY: 'auto', paddingBottom: isMobile ? '80px' : '28px' }}>

        {/* ГЛАВНАЯ */}
        {activeTab === "menu" && (
          <div>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>Добро пожаловать, <strong>{student.name}</strong>!</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '14px' }}>
              {[
                { id: 'submit', icon: '📤', title: 'Подать документы', desc: 'Загрузить файлы', color: '#2563eb' },
                { id: 'status', icon: '🕒', title: 'Мои заявки', desc: `Заявок: ${apps.length}`, color: '#7c3aed' },
                { id: 'chat', icon: '🤖', title: 'ИИ-ассистент', desc: 'Задать вопрос', color: '#059669' },
                { id: 'profile', icon: '👤', title: 'Мой профиль', desc: 'Редактировать данные', color: '#ea580c' },
              ].map(card => (
                <div key={card.id} onClick={() => { setActiveTab(card.id); if(card.id==='status') loadApps(student.login); }}
                  style={{ background: 'white', borderRadius: '14px', padding: isMobile ? '20px 16px' : '28px 24px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: isMobile ? '28px' : '32px', marginBottom: '10px' }}>{card.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: isMobile ? '14px' : '16px', color: '#1e293b', marginBottom: '4px' }}>{card.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{card.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ПОДАТЬ ДОКУМЕНТЫ */}
        {activeTab === "submit" && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#1e293b', marginBottom: '8px', fontSize: isMobile ? '17px' : '20px' }}>Загрузка документов</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Прикрепите файлы и отправьте в деканат</p>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '32px 16px', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#f8fafc', marginBottom: '16px' }}>
                <span style={{ fontSize: '36px' }}>📁</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#2563eb', fontWeight: '600', fontSize: '14px' }}>Нажмите чтобы выбрать файл</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>PDF, DOCX, JPG и другие</div>
                </div>
                <input type="file" onChange={handleFile} style={{ display: 'none' }} />
              </label>
              {files.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#0369a1', fontSize: '13px' }}>📄 {f.name}</span>
                      <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={sendDoc} disabled={loading || files.length === 0}
                style={{ width: '100%', padding: '14px', background: files.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: files.length === 0 ? 'not-allowed' : 'pointer' }}>
                {loading ? "⏳ Отправляем..." : files.length === 0 ? "Сначала выберите файлы" : `📤 Отправить ${files.length} файл(а)`}
              </button>
            </div>
          </div>
        )}

        {/* МОИ ЗАЯВКИ */}
        {activeTab === "status" && (
          <div style={{ maxWidth: '700px' }}>
            <h2 style={{ color: '#1e293b', marginBottom: '16px', fontSize: isMobile ? '17px' : '20px' }}>Мои заявки</h2>
            {apps.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <div style={{ color: '#64748b' }}>Заявок пока нет</div>
              </div>
            ) : apps.map(app => (
              <div key={app.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '12px', borderLeft: `5px solid ${statusColor(app.status)}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: statusBg(app.status), color: statusText(app.status) }}>{app.status}</span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(app.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>📄 {app.file_names?.join(", ")}</div>
                {app.comment && <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>💬 {app.comment}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ЧАТ */}
        {activeTab === "chat" && (
          <div style={{ maxWidth: '720px', height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>🤖 ИИ-ассистент Жубанова</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>Отвечает на вопросы об университете</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f1f5f9', color: m.role === 'user' ? 'white' : '#1e293b', fontSize: '14px', lineHeight: '1.5' }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && <div style={{ display: 'flex' }}><div style={{ padding: '10px 14px', background: '#f1f5f9', borderRadius: '18px 18px 18px 4px', color: '#64748b', fontSize: '14px' }}>⏳ Думаю...</div></div>}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Напишите вопрос..." style={{ flex: 1, padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', outline: 'none', fontSize: '14px', color: '#1e293b' }} />
                <button onClick={sendChat} disabled={chatLoading} style={{ padding: '11px 16px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>➤</button>
              </div>
            </div>
          </div>
        )}

        {/* ПРОФИЛЬ */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: '500px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#1e293b', marginBottom: '24px', fontSize: isMobile ? '17px' : '20px' }}>Мой профиль</h2>

              {/* Аватар */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '36px' }}>{student.name?.[0]}</span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '7px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#0369a1', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                  📷 Изменить фото
                </button>
              </div>

              {/* Поля */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>ФИО</label>
                  <input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>Группа</label>
                  <input value={profileForm.group_name} onChange={e => setProfileForm({...profileForm, group_name: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>Email</label>
                  <input value={student.email || student.login} disabled
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                </div>

                <button onClick={saveProfile} disabled={profileLoading}
                  style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: profileLoading ? 'not-allowed' : 'pointer', opacity: profileLoading ? 0.7 : 1, marginTop: '8px' }}>
                  {profileLoading ? "⏳ Сохраняем..." : "💾 Сохранить изменения"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {mainContent}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); if(item.id==='status') loadApps(student.login); }}
              style={{ flex: 1, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: activeTab === item.id ? '700' : '400', color: activeTab === item.id ? '#2563eb' : '#94a3b8' }}>{item.label}</span>
              {activeTab === item.id && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2563eb' }} />}
            </button>
          ))}
          <button onClick={() => { localStorage.removeItem("current_session"); router.push("/auth"); }}
            style={{ flex: 1, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '20px' }}>🚪</span>
            <span style={{ fontSize: '10px', color: '#ef4444' }}>Выйти</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '260px', background: 'linear-gradient(180deg, #1e3a5f 0%, #2563eb 100%)', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.15)', flexShrink: 0 }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'white', fontWeight: '700', fontSize: '22px' }}>{student.name?.[0]}</span>}
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{student.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '3px' }}>{student.group_name || student.login}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {[{ id: "menu", icon: "🏠", label: "Главная" }, { id: "chat", icon: "🤖", label: "ИИ-ассистент" }, { id: "profile", icon: "👤", label: "Мой профиль" }].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              style={{ width: '100%', padding: '12px 16px', marginBottom: '6px', border: 'none', borderRadius: '10px', background: activeTab === item.id ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', fontWeight: activeTab === item.id ? '600' : '400', fontSize: '14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 12px' }}>
          <button onClick={() => { localStorage.removeItem("current_session"); router.push("/auth"); }}
            style={{ width: '100%', padding: '11px', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', borderRadius: '10px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px' }}>
            Выйти
          </button>
        </div>
      </div>
      {mainContent}
    </div>
  );
}