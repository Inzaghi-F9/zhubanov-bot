import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/knowledge";

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "openai/gpt-oss-120b",
];

const MAX_HISTORY = 16;      // последних сообщений отправляем модели
const MAX_INPUT_LEN = 2000;  // ограничение одного сообщения
const MAX_REQUESTS = 20;     // сообщений с одного IP
const WINDOW_MS = 60_000;    // в минуту (защита квоты Groq)

// Простой in-memory rate limit — для serverless достаточно
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_REQUESTS) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

/**
 * Умный локальный ответ по базе знаний АРСУ на случай, если в Vercel не задан GROQ_API_KEY
 * или сервис Groq временно недоступен — чтобы бот ВСЕГДА отвечал студентам!
 */
function buildLocalAnswer(userText: string): string {
  const q = userText.toLowerCase();

  if (q.includes("документ") || q.includes("құжат") || q.includes("справк") || q.includes("транскрипт")) {
    return (
      "Для подачи заявки на академическую мобильность в АРСУ необходимы следующие **документы**:\n" +
      "- **Транскрипт** (выписка об оценках с GPA не ниже 3.0)\n" +
      "- **Заявление** на имя ректора и рекомендация факультета\n" +
      "- **Копия удостоверения личности** (или загранпаспорта для зарубежных вузов)\n" +
      "- **Письмо-приглашение** или мотивационное письмо\n" +
      "- **Медицинская справка 086-у** (при выезде за рубеж)\n\n" +
      "Все документы прикрепляются онлайн в разделе **«Подать заявку»** личного кабинета (до 5 МБ каждый файл)."
    );
  }

  if (q.includes("требован") || q.includes("gpa") || q.includes("кто может") || q.includes("балл") || q.includes("талап")) {
    return (
      "**Требования к участникам программы академической мобильности АРСУ:**\n" +
      "- Студент очной формы обучения (завершивший минимум 1 семестр)\n" +
      "- Средний балл **GPA от 3.0** и выше\n" +
      "- Отсутствие академических и финансовых задолженностей\n" +
      "- Соответствие образовательной программы направлению в принимающем вузе\n\n" +
      "Какой у вас текущий курс и средний балл?"
    );
  }

  if (q.includes("срок") || q.includes("поток") || q.includes("семестр") || q.includes("когда") || q.includes("мерзім")) {
    return (
      "В учебном году в АРСУ проводится **2 потока** академической мобильности:\n" +
      "- **Осенний поток (1 семестр)** — приём заявок обычно до **15 мая**\n" +
      "- **Весенний поток (2 семестр)** — приём заявок обычно до **15 ноября**\n\n" +
      "На каждом потоке подаётся около 100 заявок. При подаче заявки в личном кабинете просто выберите нужный поток из списка."
    );
  }

  if (q.includes("подать") || q.includes("заявк") || q.includes("этап") || q.includes("статус") || q.includes("өтінім")) {
    return (
      "**Как подать заявку на платформе АРСУ:**\n" +
      "1. Войдите в **Личный кабинет** (`/auth`) и укажите свой факультет, группу и GPA.\n" +
      "2. Откройте вкладку **«Подать заявку»**, выберите поток (семестр), принимающий вуз и прикрепите документы.\n" +
      "3. Заявка пройдёт этапы: **Проверка факультета → Рекомендация → Департамент → Тестирование → Интервью → Принято**.\n" +
      "4. На каждом этапе вам придёт уведомление на email, а прогресс виден на таймлайне."
    );
  }

  if (q.includes("финанс") || q.includes("платн") || q.includes("грант") || q.includes("деньг") || q.includes("стипенд")) {
    return (
      "**Финансирование академической мобильности:**\n" +
      "- **Обучение** в принимающем вузе-партнёре для студентов АРСУ — **бесплатное** (по меморандуму или государственному гранту).\n" +
      "- Есть бюджетные места (гос. грант МНВО РК покрывает перелёт, проживание, визу и страховку) и места с **собственным финансированием** (студент оплачивает дорогу и проживание).\n\n" +
      "Наличие грантовых мест уточняйте в отделе мобильности (каб. 205)."
    );
  }

  if (q.includes("вуз") || q.includes("партнер") || q.includes("партнёр") || q.includes("стран") || q.includes("куда")) {
    return (
      "**Университеты-партнёры АРСУ:**\n" +
      "- **Казахстан (внутренняя мобильность):** ЕНУ им. Гумилёва (Астана), КазНУ им. аль-Фараби и КИМЭП (Алматы) и др.\n" +
      "- **Зарубежные вузы (внешняя мобильность):** университеты Польши (Познань), Турции (Кастамону, Нигде), России (МГУ, СПбПУ, ТПУ), Беларуси (БГУ), Узбекистана и Кыргызстана.\n\n" +
      "Полный список доступен в разделе **«Вузы-партнёры»** (`/programs`)."
    );
  }

  if (q.includes("контакт") || q.includes("адрес") || q.includes("телефон") || q.includes("кабинет") || q.includes("байланыс")) {
    return (
      "**Контакты отдела академической мобильности АРСУ:**\n" +
      "- **Адрес:** г. Актобе, пр. А. Жангильдина, 34 (главный корпус, **каб. 205**)\n" +
      "- **Телефон:** +7 (7132) 54-05-05\n" +
      "- **Email:** mobility@arsu.kz\n" +
      "- **График работы:** Пн–Пт с 09:00 до 18:00"
    );
  }

  return (
    "Я — **ИИ-ассистент программы академической мобильности АРСУ им. К. Жубанова** 🎓\n\n" +
    "**Академическая мобильность** позволяет студентам учиться 1 семестр или учебный год в другом вузе Казахстана или за рубежом с полным перезачётом кредитов.\n" +
    "- **Потоки:** 2 раза в год (1 семестр — до 15 мая, 2 семестр — до 15 ноября)\n" +
    "- **Требования:** GPA от 3.0, отсутствие задолженностей\n" +
    "- **Документы:** транскрипт, заявление, удостоверение/паспорт, приглашение, справка 086-у\n" +
    "- **Контакты:** главный корпус, каб. 205, тел. +7 (7132) 54-05-05, mobility@arsu.kz\n\n" +
    "О чём рассказать подробнее: о **документах**, **требованиях GPA**, **сроках потоков** или **порядке подачи заявки**?"
  );
}

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Слишком много сообщений. Подождите минуту." },
        { status: 429 }
      );
    }

    const { messages } = (await req.json()) as { messages?: IncomingMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
    }

    // Валидация + обрезка истории
    const history = messages
      .filter(
        (m): m is IncomingMessage =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-MAX_HISTORY)
      .map((m) => ({ ...m, content: m.content.slice(0, MAX_INPUT_LEN) }));

    if (history.length === 0) {
      return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
    }

    const lastUserMessage =
      [...history].reverse().find((m) => m.role === "user")?.content ?? "";

    const apiKey = process.env.GROQ_API_KEY?.trim();

    // Если ключ Groq задан — пробуем модели по очереди
    if (apiKey) {
      const groq = new Groq({ apiKey });
      let stream = null;

      for (const model of MODELS) {
        try {
          stream = await groq.chat.completions.create({
            model,
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
            temperature: 0.4,
            stream: true,
          });
          break;
        } catch (err) {
          console.warn(`Groq model ${model} failed:`, err);
        }
      }

      if (stream) {
        const activeStream = stream;
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of activeStream) {
                const text = chunk.choices[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(text));
              }
            } catch {
              controller.enqueue(
                encoder.encode("\n\n" + buildLocalAnswer(lastUserMessage))
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }
    }

    // Надёжный встроенный фолбэк по базе знаний (работает даже если GROQ_API_KEY не прописан или невалиден)
    const fallbackText = buildLocalAnswer(lastUserMessage);
    return new Response(fallbackText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(buildLocalAnswer(""), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}
