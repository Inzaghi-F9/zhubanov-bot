"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const partners = [
    { name: "Московский государственный университет", country: "🇷🇺 Россия" },
    { name: "Санкт-Петербургский политехнический университет", country: "🇷🇺 Россия" },
    { name: "Национальный университет Узбекистана", country: "🇺🇿 Узбекистан" },
    { name: "Кыргызский национальный университет", country: "🇰🇬 Кыргызстан" },
    { name: "Белорусский государственный университет", country: "🇧🇾 Беларусь" },
    { name: "Томский политехнический университет", country: "🇷🇺 Россия" },
    { name: "Университет КИМЭП", country: "🇰🇿 Казахстан" },
    { name: "Евразийский национальный университет", country: "🇰🇿 Казахстан" },
  ];

  const faqs = [
    { q: "Кто может подать заявку на академическую мобильность?", a: "Студенты очной формы обучения, завершившие минимум один семестр, со средним баллом не ниже 3.0 и отсутствием академических задолженностей." },
    { q: "Какие документы нужны для подачи заявки?", a: "Паспорт, академическая справка, транскрипт оценок, мотивационное письмо, рекомендательное письмо от научного руководителя." },
    { q: "Сколько длится программа мобильности?", a: "Обычно один академический семестр — от 3 до 6 месяцев. Максимальный срок — 12 месяцев." },
    { q: "Покрываются ли расходы на обучение?", a: "Обучение в принимающем университете, как правило, бесплатное. Расходы на проживание и переезд студент покрывает самостоятельно или за счёт грантов." },
    { q: "Как отслеживать статус заявки?", a: "После регистрации на платформе вы можете в любое время войти в личный кабинет и проверить текущий статус вашей заявки. Также вы получите email-уведомление при каждом изменении статуса." },
    { q: "Что такое шорт-лист факультета?", a: "После проверки документов факультет формирует список рекомендованных кандидатов. Если вы в шорт-листе, ваша заявка передаётся в департамент для финального рассмотрения." },
  ];

  const steps = [
    { num: "01", title: "Регистрация", desc: "Создайте аккаунт на платформе и заполните профиль студента", icon: "👤" },
    { num: "02", title: "Подача заявки", desc: "Заполните анкету и загрузите необходимые документы онлайн", icon: "📤" },
    { num: "03", title: "Проверка факультетом", desc: "Факультет проверяет документы и формирует список кандидатов", icon: "🏛️" },
    { num: "04", title: "Рассмотрение департаментом", desc: "Департамент проводит тестирование и интервью с кандидатами", icon: "🎓" },
    { num: "05", title: "Решение", desc: "Вы получаете уведомление о результатах на email", icon: "✅" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b' }}>

      {/* Навигация */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🎓</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#1e293b' }}>ARSU Mobility</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Университет им. К. Жубанова</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="#about" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>О программе</a>
          <a href="#steps" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>Как подать</a>
          <a href="#partners" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>Партнёры</a>
          <a href="#faq" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>FAQ</a>
          <button onClick={() => router.push('/auth')}
            style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            Войти
          </button>
        </div>
      </nav>

      {/* Герой */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #0d9488 100%)', padding: '80px 32px', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', marginBottom: '24px' }}>
            🌍 Программа академической мобильности
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 20px 0', lineHeight: 1.2 }}>
            Учись за рубежом с <span style={{ color: '#7dd3fc' }}>ARSU Mobility</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', margin: '0 0 36px 0', lineHeight: 1.6 }}>
            Цифровая платформа для подачи заявок на академическую мобильность университета им. К. Жубанова. Подайте заявку онлайн и отслеживайте её статус в реальном времени.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/auth')}
              style={{ padding: '14px 32px', background: 'white', color: '#2563eb', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '16px' }}>
              Подать заявку →
            </button>
            <a href="#about"
              style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', textDecoration: 'none', display: 'inline-block' }}>
              Узнать больше
            </a>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section style={{ background: 'white', padding: '40px 32px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', textAlign: 'center' }}>
          {[
            { num: '8+', label: 'Университетов-партнёров' },
            { num: '5', label: 'Этапов отбора' },
            { num: '3', label: 'Роли пользователей' },
            { num: '24/7', label: 'ИИ-ассистент' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#2563eb' }}>{s.num}</div>
              <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* О программе */}
      <section id="about" style={{ padding: '80px 32px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', textAlign: 'center', marginBottom: '16px' }}>О программе мобильности</h2>
          <p style={{ color: '#64748b', textAlign: 'center', fontSize: '16px', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
            Академическая мобильность — это возможность пройти обучение в ведущих университетах Казахстана и зарубежья
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { icon: '🌍', title: 'Международный опыт', desc: 'Обучайтесь в университетах России, Беларуси, Кыргызстана, Узбекистана и других стран' },
              { icon: '📜', title: 'Перезачёт кредитов', desc: 'Все освоенные предметы перезачитываются в вашем университете по возвращении' },
              { icon: '🤖', title: 'ИИ-ассистент', desc: 'Получайте мгновенные ответы на вопросы о программе через встроенный чат-бот' },
              { icon: '📱', title: 'Онлайн заявка', desc: 'Подавайте документы и отслеживайте статус заявки не выходя из дома' },
              { icon: '🔔', title: 'Уведомления', desc: 'Получайте email-уведомления при каждом изменении статуса вашей заявки' },
              { icon: '🏆', title: 'Прозрачный отбор', desc: 'Многоэтапная система: факультет → департамент → финальное решение' },
            ].map(card => (
              <div key={card.title} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
                <h3 style={{ fontWeight: '700', marginBottom: '8px', fontSize: '16px' }}>{card.title}</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Шаги */}
      <section id="steps" style={{ padding: '80px 32px', background: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', textAlign: 'center', marginBottom: '48px' }}>Как подать заявку</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '24px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #2563eb, #0d9488)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', marginBottom: '4px' }}>ШАГ {step.num}</div>
                  <h3 style={{ fontWeight: '700', fontSize: '16px', margin: '0 0 6px 0' }}>{step.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button onClick={() => router.push('/auth')}
              style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '16px' }}>
              Начать → Подать заявку
            </button>
          </div>
        </div>
      </section>

      {/* Партнёры */}
      <section id="partners" style={{ padding: '80px 32px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', textAlign: 'center', marginBottom: '12px' }}>Университеты-партнёры</h2>
          <p style={{ color: '#64748b', textAlign: 'center', fontSize: '16px', marginBottom: '40px' }}>Куда вы можете поехать по программе мобильности</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {partners.map((p, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '18px 20px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '28px' }}>{p.country.split(' ')[0]}</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{p.name}</div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{p.country.split(' ').slice(1).join(' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '80px 32px', background: 'white' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', textAlign: 'center', marginBottom: '12px' }}>Частые вопросы</h2>
          <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '40px' }}>Не нашли ответ? Спросите у нашего ИИ-ассистента в личном кабинете</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '18px 20px', background: openFaq === i ? '#f0f9ff' : 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>{faq.q}</span>
                  <span style={{ fontSize: '20px', color: '#2563eb', flexShrink: 0, marginLeft: '12px' }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', color: '#64748b', fontSize: '14px', lineHeight: '1.7', borderTop: '1px solid #e5e7eb', background: '#f0f9ff' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Контакты */}
      <section id="contacts" style={{ padding: '80px 32px', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px' }}>Свяжитесь с нами</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '40px', fontSize: '16px' }}>Если у вас остались вопросы — мы готовы помочь</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {[
              { icon: '📍', title: 'Адрес', value: 'г. Актобе, пр. А. Молдагуловой, 34' },
              { icon: '📞', title: 'Телефон', value: '+7 (7132) 54-19-79' },
              { icon: '✉️', title: 'Email', value: 'mobility@zhubanov.edu.kz' },
            ].map(c => (
              <div key={c.title} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{c.icon}</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{c.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{c.value}</div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/auth')}
            style={{ padding: '14px 36px', background: 'white', color: '#2563eb', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '16px' }}>
            Подать заявку сейчас →
          </button>
        </div>
      </section>

      {/* Футер */}
      <footer style={{ background: '#0f172a', padding: '24px 32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        © 2026 ARSU Mobility — Университет им. К. Жубанова. Все права защищены.
      </footer>
    </div>
  );
}