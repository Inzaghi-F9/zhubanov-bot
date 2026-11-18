"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Bot, Upload, Activity, ArrowRight, ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";

const FEATURES = [
  { icon: Bot, title: "ИИ-ассистент 24/7", text: "Мгновенные ответы о мобильности, документах и сроках — на русском, казахском и английском" },
  { icon: Upload, title: "Заявки онлайн", text: "Подача документов в пару кликов, без очередей и бумаги" },
  { icon: Activity, title: "Прозрачный статус", text: "Виден каждый шаг: факультет → департамент → тест → интервью → решение" },
  { icon: Mail, title: "Email-уведомления", text: "Письмо на каждом изменении статуса — ничего не пропустите" },
];

const FAQ = [
  { q: "Что такое академическая мобильность?", a: "Это возможность студентам АРСУ учиться один семестр или год в другом вузе Казахстана или за рубежом. Кредиты засчитываются обратно в АРСУ, вы не теряете темп обучения." },
  { q: "Какие документы нужны?", a: "Транскрипт, заявление, копия удостоверения личности, письмо-приглашение или договор с принимающим вузом. Для выезда за рубеж — медицинская справка 086-у." },
  { q: "Кто может участвовать?", a: "Студенты со средним баллом GPA от 3.0, без академических задолженностей, с профилем обучения, соответствующим программе принимающего вуза." },
  { q: "Как подать заявку?", a: "Зарегистрируйтесь, заполните профиль, приложите документы и отправьте заявку через личный кабинет. Дальше отслеживайте статус — на каждом шаге придёт письмо." },
  { q: "Это платно?", a: "Есть места по академическому гранту (финансирует государство) и вариант по собственному финансированию. Проживание и проезд обычно оплачивает студент." },
  { q: "Куда обратиться за помощью?", a: "Отдел академической мобильности АРСУ, главный корпус, каб. 205. Email: mobility@arsu.kz, телефон: +7 (7132) 54-05-05. Или спросите ИИ-ассистента прямо здесь." },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Навбар */}
      <nav className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--card)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <GraduationCap size={19} />
            </div>
            <div className="text-sm font-bold">ARSU Мобильность</div>
          </div>
          <div className="hidden items-center gap-5 text-xs font-medium text-slate-600 md:flex">
            <Link href="/programs" className="hover:text-blue-600 transition">Вузы-партнёры</Link>
            <Link href="/internships" className="hover:text-blue-600 transition">Стажировки</Link>
            <Link href="/faq" className="hover:text-blue-600 transition">FAQ</Link>
            <Link href="/contacts" className="hover:text-blue-600 transition">Контакты</Link>
          </div>
          <Link href="/auth"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700">
            Войти <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Hero + чат */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:py-16">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
            🎓 Университет им. К. Жубанова (АРСУ)
          </div>
          <h1 className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl lg:text-5xl">
            Учись в другом вузе,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              не теряя ни семестра
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
            Платформа академической мобильности АРСУ: подай заявку онлайн, следи за статусом
            по таймлайну и получай ответы ИИ-ассистента в любое время.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">
              Начать <ArrowRight size={15} />
            </Link>
            <a href="#faq"
              className="card inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:border-blue-400">
              Частые вопросы
            </a>
          </div>

          {/* Фичи */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card rounded-2xl p-4 shadow-sm">
                <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Icon size={16} />
                </div>
                <div className="text-xs font-bold">{title}</div>
                <div className="mt-1 text-[11px] leading-snug text-slate-500">{text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Живой чат */}
        <div className="card flex h-[520px] flex-col overflow-hidden rounded-3xl shadow-xl">
          <div className="flex items-center gap-2 border-b border-[color:var(--border)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <Bot size={17} />
            </div>
            <div>
              <div className="text-sm font-semibold">ИИ-ассистент АРСУ</div>
              <div className="text-[11px] text-slate-400">🟢 Онлайн — попробуйте прямо сейчас, без регистрации</div>
            </div>
          </div>
          <ChatBox className="flex-1" />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[color:var(--border)] bg-[color:var(--card)]/50">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-center text-2xl font-extrabold">Частые вопросы</h2>
          <p className="mt-2 text-center text-sm text-slate-500">Всё об академической мобильности АРСУ</p>

          <div className="mt-8 space-y-2.5">
            {FAQ.map((item, i) => (
              <div key={i} className="card overflow-hidden rounded-2xl shadow-sm">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-semibold transition hover:bg-slate-50">
                  {item.q}
                  <ChevronDown size={16}
                    className={`shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-[color:var(--border)] p-4 text-sm leading-relaxed text-slate-500">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-gradient-to-br from-blue-950 to-indigo-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap size={22} />
                <div className="font-bold">ARSU Мобильность</div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-blue-200/70">
                Платформа академической мобильности Актюбинского регионального
                университета им. К. Жубанова.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-blue-300 uppercase">Контакты</div>
              <div className="mt-3 space-y-2 text-xs text-blue-100/80">
                <div className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0" /> пр. Алиби Жангильдина, 34, Актобе</div>
                <div className="flex items-center gap-2"><Mail size={13} className="shrink-0" /> mobility@arsu.kz</div>
                <div className="flex items-center gap-2"><Phone size={13} className="shrink-0" /> +7 (7132) 54-05-05, каб. 205</div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-blue-300 uppercase">Приём заявок</div>
              <div className="mt-3 space-y-2 text-xs text-blue-100/80">
                <div>📅 До 15 мая — на осенний семестр</div>
                <div>📅 До 15 ноября — на весенний семестр</div>
              </div>
              <Link href="/auth"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold transition hover:bg-blue-700">
                Личный кабинет <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-5 text-center text-[11px] text-blue-200/50">
            © {new Date().getFullYear()} Университет им. К. Жубанова (АРСУ)
          </div>
        </div>
      </footer>
    </div>
  );
}