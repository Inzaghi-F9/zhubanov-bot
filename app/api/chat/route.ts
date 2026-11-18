import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/knowledge";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
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

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY не задан на сервере" },
        { status: 500 }
      );
    }

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

    // Стриминг: бот печатает по мере генерации (с резервной моделью на случай лимитов)
    let stream;
    try {
      stream = await groq.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        temperature: 0.4,
        stream: true,
      });
    } catch {
      stream = await groq.chat.completions.create({
        model: FALLBACK_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        temperature: 0.4,
        stream: true,
      });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch {
          controller.enqueue(
            encoder.encode("\n\n⚠️ Связь с ИИ прервалась. Попробуйте ещё раз.")
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
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Ошибка связи с ИИ. Попробуйте позже." },
      { status: 500 }
    );
  }
}
