"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MobilityProgramsPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const programs = [
    {
      id: 1,
      country: "Россия",
      flag: "🇷🇺",
      universities: [
        { name: "Московский государственный университет", city: "Москва", specialties: "Все направления", duration: "1-2 семестра", level: "Бакалавриат, магистратура" },
        { name: "Санкт-Петербургский политехнический университет", city: "Санкт-Петербург", specialties: "Инженерия, технологии", duration: "1-2 семестра", level: "Бакалавриат, магистратура" },
        { name: "Томский политехнический университет", city: "Томск", specialties: "IT, инженерия", duration: "1-2 семестра", level: "Бакалавриат, магистратура" }
      ]
    },
    {
      id: 2,
      country: "Узбекистан",
      flag: "🇺🇿",
      universities: [
        { name: "Национальный университет Узбекистана", city: "Ташкент", specialties: "Гуманитарные науки, экономика", duration: "1-2 семестра", level: "Бакалавриат, магистратура" }
      ]
    },
    {
      id: 3,
      country: "Кыргызстан",
      flag: "🇰🇬",
      universities: [
        { name: "Кыргызский национальный университет", city: "Бишкек", specialties: "Все направления", duration: "1-2 семестра", level: "Бакалавриат, магистратура" }
      ]
    },
    {
      id: 4,
      country: "Беларусь",
      flag: "🇧🇾",
      universities: [
        { name: "Белорусский государственный университет", city: "Минск", specialties: "Все направления", duration: "1-2 семестра", level: "Бакалавриат, магистратура" }
      ]
    },
    {
      id: 5,
      country: "Казахстан",
      flag: "🇰🇿",
      universities: [
        { name: "Университет КИМЭП", city: "Алматы", specialties: "Экономика, бизнес", duration: "1-2 семестра", level: "Бакалавриат, магистратура" },
        { name: "Евразийский национальный университет", city: "Нур-Султан", specialties: "Все направления", duration: "1-2 семестра", level: "Бакалавриат, магистратура" }
      ]
    }
  ];

  const benefits = [
    { icon: "🎓", title: "Новые знания", desc: "Получите опыт обучения в другом университете" },
    { icon: "🌍", title: "Международное общение", desc: "Разноообразьте свой опыт, встречайтесь с новыми людьми" },
    { icon: "💼", title: "Карьерные перспективы", desc: "Повысьте конкурентоспособность на рынке труда" },
    { icon: "📜", title: "Признание", desc: "Получите признание достижений в других вузах" },
    { icon: "🗣️", title: "Языковые навыки", desc: "Улучшите знание иностранных языков" },
    { icon: "🤝", title: "Сети контактов", desc: "Расширьте профессиональную сеть" }
  ];

  const requirements = [
    "Пройден минимум 1 семестр обучения",
    "Средний балл не ниже 3.0 (GPA)",
    "Отсутствие академических задолженностей",
    "Готовность к обучению на иностранном языке (обычно английский)",
    "Наличие всех необходимых документов",
    "Здоровое состояние здоровья"
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0d9488)', padding: isMobile ? '16px' : '24px 32px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <span style={{ fontSize: '28px' }}>🌍</span>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: isMobile ? '18px' : '20px' }}>Программы мобильности</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Список университетов-партнёров</div>
            </div>
          </div>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            ← Вернуться
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
        {/* Преимущества */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Преимущества программы академической мобильности</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {benefits.map((benefit, i) => (
            <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{benefit.icon}</div>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '15px' }}>{benefit.title}</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{benefit.desc}</div>
            </div>
          ))}
        </div>

        {/* Требования */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Требования для участия</h2>
        <div style={{ background: 'white', padding: isMobile ? '20px' : '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
            {requirements.map((req, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: '#0d9488', fontWeight: 'bold', fontSize: '18px' }}>✓</span>
                <span style={{ color: '#475569', fontSize: '14px' }}>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Университеты */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Университеты-партнёры</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
          {programs.map((program) => (
            <div key={program.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <button
                onClick={() => setSelectedCountry(selectedCountry === program.country ? null : program.country)}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: selectedCountry === program.country ? '#f0f4f8' : 'white',
                  border: 'none',
                  borderBottom: selectedCountry === program.country ? '3px solid #0d9488' : 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{program.flag}</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>{program.country}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>{program.universities.length} университет</div>
                  </div>
                </div>
                <span style={{ fontSize: '20px' }}>{selectedCountry === program.country ? '−' : '+'}</span>
              </button>

              {selectedCountry === program.country && (
                <div style={{ padding: '16px', background: '#f9fafb', borderTop: '1px solid #e2e8f0' }}>
                  {program.universities.map((uni, i) => (
                    <div key={i} style={{ marginBottom: i < program.universities.length - 1 ? '16px' : 0, paddingBottom: i < program.universities.length - 1 ? '16px' : 0, borderBottom: i < program.universities.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: '#1e293b' }}>{uni.name}</div>
                      <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                        <div>📍 Город: {uni.city}</div>
                        <div>📚 Специальности: {uni.specialties}</div>
                        <div>⏱️ Длительность: {uni.duration}</div>
                        <div>🎓 Уровень: {uni.level}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0d9488)', color: 'white', padding: isMobile ? '24px 16px' : '32px 40px', borderRadius: '12px', marginTop: '32px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Готовы к новому опыту?</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.9 }}>Подайте заявку на участие в программе академической мобильности</p>
          <button onClick={() => router.push('/auth')} style={{ background: 'white', color: '#1e3a5f', padding: '12px 28px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            Заполнить заявку →
          </button>
        </div>
      </div>
    </div>
  );
}
