"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function FAQPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:string,content:string}[]>([
    {role:"assistant", content:"Сәлеметсіз бе! 👋 Я ИИ-ассистент университета им. К. Жубанова. Чем я могу вам помочь? Задайте вопрос о программе мобильности, документах или процессе подачи заявки."}
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const faqs = [
    { 
      q: "Кто может подать заявку на академическую мобильность?", 
      a: "Студенты очной формы обучения, завершившие минимум один семестр, со средним баллом не ниже 3.0 и отсутствием академических задолженностей." 
    },
    { 
      q: "Какие документы нужны для подачи заявки?", 
      a: "Паспорт, академическая справка, транскрипт оценок (выписка из ведомости), мотивационное письмо (на английском языке), рекомендательное письмо от научного руководителя или преподавателя, справка о здоровье (медицинская справка по форме 086)." 
    },
    { 
      q: "Сколько длится программа мобильности?", 
      a: "Обычно один академический семестр — от 3 до 6 месяцев. Максимальный срок обучения за границей — 12 месяцев в рамках одной программы." 
    },
    { 
      q: "Покрываются ли расходы на обучение?", 
      a: "Обучение в принимающем университете, как правило, бесплатное (обучение покрывается грантом для студентов из программы академической мобильности). Расходы на проживание, питание и переезд студент покрывает самостоятельно или за счёт грантов." 
    },
    { 
      q: "Как отслеживать статус заявки?", 
      a: "После регистрации на платформе войдите в личный кабинет и проверьте текущий статус вашей заявки. Также вы получите email-уведомление при каждом изменении статуса. Используйте раздел 'Мои заявки' в кабинете студента." 
    },
    { 
      q: "Что такое шорт-лист факультета?", 
      a: "После проверки документов факультет формирует список рекомендованных кандидатов. Если вы в шорт-листе, это означает, что факультет рекомендует вашу кандидатуру, и ваша заявка передаётся в департамент для финального рассмотрения и возможного включения в программу мобильности." 
    },
    { 
      q: "Какие есть университеты-партнёры?", 
      a: "У нас есть партнёрские соглашения с университетами в России (МГУ, СПбПУ, ТПУ), Узбекистане (НУУ), Кыргызстане (КНУ), Беларуси (БГУ) и Казахстане (КИМЭП, ЕНУ). Актуальный список доступен в разделе 'Программы мобильности'." 
    },
    { 
      q: "Нужна ли виза для обучения за границей?", 
      a: "Да, для обучения в большинстве стран требуется студенческая виза. Принимающий университет обычно помогает с необходимыми документами. Консультации о визовых требованиях получайте в департаменте международного сотрудничества." 
    },
    { 
      q: "Как пройти этап факультетского отбора?", 
      a: "Загрузите полный пакет документов на платформе. Факультет проверит критерии (средний балл, наличие задолженностей, качество документов). Если документы в порядке, вы будете включены в шорт-лист и рекомендованы факультетом." 
    },
    { 
      q: "Что происходит на этапе тестирования и интервью?", 
      a: "После рекомендации факультета админист​рация проводит тестирование (обычно английский язык и тест на знание предмета) и интервью. Дата, время и место будут сообщены отдельно через email и личный кабинет." 
    },
  ];

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, { role: "user", content: userMessage }].map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
        })
      });

      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.text }]);
    } catch {
      toast.error("Ошибка при отправке сообщения");
    }
    setChatLoading(false);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #0d9488)', padding: isMobile ? '16px' : '24px 32px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <span style={{ fontSize: '28px' }}>❓</span>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: isMobile ? '18px' : '20px' }}>FAQ & Помощь</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Часто задаваемые вопросы</div>
            </div>
          </div>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            ← Вернуться на главную
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px' : '32px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
        {/* FAQ Раздел */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', color: '#1e293b' }}>Ответы на популярные вопросы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: openFaq === i ? '#f0f4f8' : 'white',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1e293b',
                    transition: 'background 0.2s',
                    borderBottom: openFaq === i ? '2px solid #0d9488' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '20px' }}>{openFaq === i ? '−' : '+'}</span>
                  </div>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '16px', background: '#f9fafb', color: '#475569', lineHeight: '1.6', fontSize: '14px', borderTop: '1px solid #e2e8f0' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Раздел */}
        <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '600px' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, #1e3a5f, #0d9488)', color: 'white', fontWeight: '600' }}>
              💬 AI-ассистент
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'assistant' ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: msg.role === 'assistant' ? '#f0f4f8' : '#0d9488',
                    color: msg.role === 'assistant' ? '#1e293b' : 'white',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#f0f4f8', padding: '12px 14px', borderRadius: '10px', color: '#475569', fontSize: '13px' }}>
                    ✓ Печатает...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '12px', background: '#f9fafb', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Напишите вопрос..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'white'
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading}
                style={{
                  padding: '10px 14px',
                  background: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  opacity: chatLoading ? 0.6 : 1
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
