"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, ChevronDown, Bot } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";

const FAQS = [
  {
    q: "Кто может подать заявку на академическую мобильность?",
    a: "Студенты очной формы обучения АРСУ, завершившие минимум один семестр, со средним баллом GPA не ниже 3.0 и без академических задолженностей.",
  },
  {
    q: "Сколько потоков в году и когда подавать документы?",
    a: "В каждом учебном году 2 потока: осенний (1 семестр — подача заявок до 15 мая) и весенний (2 семестр — подача заявок до 15 ноября).",
  },
  {
    q: "Какие документы нужны для подачи заявки?",
    a: "Транскрипт оценок, заявление, копия удостоверения личности (или загранпаспорта), мотивационное письмо или приглашение от принимающего вуза, рекомендательное письмо и медицинская справка формы 086-у (для зарубежной мобильности).",
  },
  {
    q: "Сколько длится программа мобильности?",
    a: "Обычно один академический семестр (от 4 до 5 месяцев), максимум — до одного учебного года. Все освоенные кредиты перезасчитываются в АРСУ.",
  },
  {
    q: "Покрываются ли расходы на обучение?",
    a: "Обучение в вузе-партнёре по программе академической мобильности бесплатное (по гранту МНВО РК или меморандуму между вузами). Проезд и проживание покрываются грантом (при наличии бюджетных мест) либо за счёт собственных средств.",
  },
  {
    q: "Как отслеживать статус заявки?",
    a: "В личном кабинете в разделе «Мои заявки» отображается интерактивный таймлайн. Кроме того, при каждом изменении статуса вам приходит уведомление на email.",
  },
  {
    q: "Что делать, если факультет или департамент вернул заявку на доработку?",
    a: "В личном кабинете вы увидите комментарий с причиной отклонения и кнопку «Исправить и подать повторно». Загрузите недостающий документ и отправьте заявку заново.",
  },
  {
    q: "Что происходит на этапе тестирования и интервью?",
    a: "После рекомендации факультета департамент приглашает кандидатов на языковое тестирование и конкурсное интервью с комиссией. Уведомление придёт на почту и в личный кабинет.",
  },
];

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--card)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <GraduationCap size={19} />
            </div>
            <div>
              <div className="text-sm font-bold">FAQ и Помощь</div>
              <div className="text-[11px] text-slate-400">Академическая мобильность АРСУ</div>
            </div>
          </Link>
          <Link
            href="/"
            className="card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:border-blue-400"
          >
            <ArrowLeft size={13} /> На главную
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-2">
        <div>
          <h1 className="text-2xl font-extrabold">Ответы на популярные вопросы</h1>
          <p className="mt-1 text-sm text-slate-500">
            Всё о правилах подачи, документах, потоках и этапах отбора
          </p>

          <div className="mt-6 space-y-2.5">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden rounded-2xl shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-semibold transition hover:bg-slate-50"
                >
                  {faq.q}
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-[color:var(--border)] p-4 text-sm leading-relaxed text-slate-500">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card flex h-[580px] flex-col overflow-hidden rounded-3xl shadow-xl">
          <div className="flex items-center gap-2 border-b border-[color:var(--border)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <Bot size={17} />
            </div>
            <div>
              <div className="text-sm font-semibold">ИИ-ассистент АРСУ</div>
              <div className="text-[11px] text-slate-400">
                🟢 Онлайн — задайте любой вопрос о мобильности
              </div>
            </div>
          </div>
          <ChatBox className="flex-1 min-h-0" />
        </div>
      </main>
    </div>
  );
}
