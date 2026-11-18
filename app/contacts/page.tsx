"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ContactsPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Сообщение отправлено! Мы свяжемся с вами в ближайшее время.");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error("Ошибка при отправке сообщения");
      }
    } catch {
      toast.error("Ошибка при отправке");
    }
    setLoading(false);
  };

  const contacts = [
    {
      icon: "📍",
      title: "Адрес",
      content: "пр. А. Жангильдина, 34, Актобе",
      subtext: "Университет им. К. Жубанова, главный корпус, каб. 205"
    },
    {
      icon: "📞",
      title: "Телефон",
      content: "+7 (7132) 54-05-05",
      subtext: "Отдел академической мобильности и международного сотрудничества"
    },
    {
      icon: "📧",
      title: "Email",
      content: "mobility@arsu.kz",
      subtext: "Вопросы по академической мобильности"
    },
    {
      icon: "🕐",
      title: "Часы работы",
      content: "Пн-Пт: 09:00 - 18:00",
      subtext: "Обеденный перерыв: 13:00 - 14:00"
    }
  ];

  const departments = [
    {
      name: "Департамент международного сотрудничества",
      phone: "+7 (7132) 54-05-05",
      email: "mobility@arsu.kz",
      location: "Главный корпус, кабинет 205"
    },
    {
      name: "Физико-математический факультет (ИТ)",
      phone: "+7 (7132) 56-34-25",
      email: "fmf@arsu.kz",
      location: "Учебный корпус по ул. Братьев Жубановых"
    },
    {
      name: "Факультет экономики и права",
      phone: "+7 (7132) 54-12-10",
      email: "fep@arsu.kz",
      location: "Учебный корпус, деканат ФЭП"
    },
    {
      name: "Технический факультет",
      phone: "+7 (7132) 54-38-15",
      email: "tech@arsu.kz",
      location: "Технический корпус, деканат"
    }
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0d9488)', padding: isMobile ? '16px' : '24px 32px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <span style={{ fontSize: '28px' }}>📬</span>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: isMobile ? '18px' : '20px' }}>Контакты</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Связь с администрацией</div>
            </div>
          </div>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            ← Вернуться
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
        {/* Contact Info */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Основная информация</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {contacts.map((contact, i) => (
            <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{contact.icon}</div>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>{contact.title}</div>
              <div style={{ fontWeight: '600', color: '#0d9488', marginBottom: '4px' }}>{contact.content}</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{contact.subtext}</div>
            </div>
          ))}
        </div>

        {/* Departments */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Контакты факультетов</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {departments.map((dept, i) => (
            <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: '#1e293b' }}>{dept.name}</div>
              <div style={{ fontSize: '13px', marginBottom: '8px', color: '#475569' }}>
                <div style={{ marginBottom: '6px' }}>📞 <a href={`tel:${dept.phone}`} style={{ color: '#0d9488', textDecoration: 'none' }}>{dept.phone}</a></div>
                <div style={{ marginBottom: '6px' }}>📧 <a href={`mailto:${dept.email}`} style={{ color: '#0d9488', textDecoration: 'none' }}>{dept.email}</a></div>
                <div>📍 {dept.location}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Форма обратной связи</h2>
        <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '600px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Ваше имя *</label>
              <input
                type="text"
                placeholder="Иван Петров"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Ваш email *</label>
              <input
                type="email"
                placeholder="ivan@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Тема *</label>
              <input
                type="text"
                placeholder="Вопрос о документах"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Сообщение *</label>
              <textarea
                placeholder="Напишите ваше сообщение..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Отправка..." : "Отправить сообщение"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
