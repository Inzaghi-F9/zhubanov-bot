"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InternshipsPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const internships = [
    {
      id: 1,
      title: "Стажировка в IT-компаниях",
      company: "Технологические партнёры",
      locations: ["Алматы", "Астана", "Минск", "Москва"],
      duration: "2-3 месяца",
      specialties: "Программирование, DevOps, UX/UI",
      salary: "По договорённости",
      description: "Возможность получить практический опыт в ведущих IT-компаниях, работать над реальными проектами"
    },
    {
      id: 2,
      title: "Стажировка в финансовом секторе",
      company: "Банки и финансовые организации",
      locations: ["Алматы", "Астана", "Москва"],
      duration: "3 месяца",
      specialties: "Финансы, экономика, аналитика",
      salary: "Оплачиваемая",
      description: "Работа в отделах финансового анализа, инвестиций, корпоративных финансов"
    },
    {
      id: 3,
      title: "Стажировка в консалтинге",
      company: "Консалтинговые фирмы",
      locations: ["Алматы", "Бишкек", "Ташкент"],
      duration: "2-4 месяца",
      specialties: "Бизнес-консалтинг, стратегия",
      salary: "По договорённости",
      description: "Участие в проектах по стратегическому развитию компаний, анализ бизнес-процессов"
    },
    {
      id: 4,
      title: "Стажировка в государственных органах",
      company: "Министерства и ведомства",
      locations: ["Астана", "Алматы"],
      duration: "3 месяца",
      specialties: "Государственное управление, политика",
      salary: "Оплачиваемая",
      description: "Работа в государственных учреждениях на различных уровнях управления"
    },
    {
      id: 5,
      title: "Исследовательская стажировка",
      company: "Научные центры и университеты",
      locations: ["Алматы", "Москва", "Санкт-Петербург"],
      duration: "2-6 месяцев",
      specialties: "Науки, исследования",
      salary: "Возможна",
      description: "Участие в научных проектах, возможность опубликовать статью"
    },
    {
      id: 6,
      title: "Стажировка в NGO и социальных организациях",
      company: "Некоммерческие организации",
      locations: ["Алматы", "Бишкек", "Ташкент"],
      duration: "2-3 месяца",
      specialties: "Социальная работа, развитие",
      salary: "Может быть оплачиваемой",
      description: "Практический опыт в социальном секторе, работа с сообществами"
    }
  ];

  const requirements = [
    "Студент 2-го курса и выше",
    "Средний балл не ниже 2.5",
    "Знание английского языка (уровень не ниже B1)",
    "Завершение обязательной части программы обучения",
    "Рекомендация от куратора или преподавателя",
    "Наличие всех необходимых документов"
  ];

  const benefits = [
    { icon: "💼", title: "Практический опыт", desc: "Применение полученных знаний на практике" },
    { icon: "🤝", title: "Профессиональные контакты", desc: "Расширение сети профессионального общения" },
    { icon: "📈", title: "Карьерный рост", desc: "Улучшение перспектив трудоустройства" },
    { icon: "💰", title: "Дополнительный доход", desc: "Многие стажировки оплачиваются" },
    { icon: "🎓", title: "Сертификат", desc: "Получение сертификата о прохождении стажировки" },
    { icon: "🌟", title: "Рекомендация", desc: "Рекомендательное письмо от работодателя" }
  ];

  const steps = [
    { num: "01", title: "Выбор стажировки", desc: "Выберите интересующую вас программу стажировки" },
    { num: "02", title: "Подача заявки", desc: "Заполните форму и загрузите необходимые документы" },
    { num: "03", title: "Собеседование", desc: "Пройдите собеседование с представителем компании" },
    { num: "04", title: "Утверждение", desc: "Получите подтверждение от вашего факультета" },
    { num: "05", title: "Стажировка", desc: "Работайте в компании и получайте опыт" },
    { num: "06", title: "Завершение", desc: "Получите сертификат и рекомендацию" }
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', padding: isMobile ? '16px' : '24px 32px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <span style={{ fontSize: '28px' }}>💼</span>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: isMobile ? '18px' : '20px' }}>Программы стажировки</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Опыт работы в ведущих компаниях</div>
            </div>
          </div>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            ← Вернуться
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
        {/* Преимущества */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
            Преимущества стажировки
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
            {benefits.map((benefit, i) => (
              <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center', transition: 'all 0.3s' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{benefit.icon}</div>
                <h3 style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>{benefit.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Требования */}
        <div style={{ marginBottom: '48px', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '16px' }}>Требования</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
            {requirements.map((req, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: '#7c3aed', fontWeight: '700', fontSize: '18px' }}>✓</span>
                <span style={{ fontSize: '14px' }}>{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Этапы */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
            Как подать заявку на стажировку
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '20px',
                  margin: '0 auto 12px'
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Стажировки */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
            Доступные стажировки
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            {internships.map((internship) => (
              <div key={internship.id} style={{ 
                background: 'white', 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{internship.title}</h3>
                    <p style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '600' }}>{internship.company}</p>
                  </div>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {internship.duration}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '12px' }}>
                  {internship.description}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px', fontSize: '13px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <div><strong>🌍 Города:</strong> {internship.locations.join(', ')}</div>
                  <div><strong>📚 Специальности:</strong> {internship.specialties}</div>
                  <div><strong>💰 Зарплата:</strong> {internship.salary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', padding: '48px 24px', borderRadius: '16px', textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', marginBottom: '12px' }}>
            Готовы к новым вызовам?
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '24px', opacity: 0.9 }}>
            Начните свою карьеру со стажировки в ведущей компании
          </p>
          <button onClick={() => router.push('/dashboard')} style={{
            background: 'white',
            color: '#7c3aed',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            Подать заявку
          </button>
        </div>
      </div>
    </div>
  );
}
