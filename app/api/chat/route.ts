import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/knowledge";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "openai/gpt-oss-120b";
const MAX_HISTORY = 16;      // РїРѕСЃР»РµРґРЅРёС… СЃРѕРѕР±С‰РµРЅРёР№ РѕС‚РїСЂР°РІР»СЏРµРј РјРѕРґРµР»Рё
const MAX_INPUT_LEN = 2000;  // РѕРіСЂР°РЅРёС‡РµРЅРёРµ РѕРґРЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ
const MAX_REQUESTS = 20;     // СЃРѕРѕР±С‰РµРЅРёР№ СЃ РѕРґРЅРѕРіРѕ IP
const WINDOW_MS = 60_000;    // РІ РјРёРЅСѓС‚Сѓ (Р·Р°С‰РёС‚Р° РєРІРѕС‚С‹ Groq)

// РџСЂРѕСЃС‚РѕР№ in-memory rate limit вЂ” РґР»СЏ serverless РґРѕСЃС‚Р°С‚РѕС‡РЅРѕ
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
      return NextResponse.json({ error: "GROQ_API_KEY РЅРµ Р·Р°РґР°РЅ" }, { status: 500 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "РЎР»РёС€РєРѕРј РјРЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёР№. РџРѕРґРѕР¶РґРёС‚Рµ РјРёРЅСѓС‚Сѓ." },
        { status: 429 }
      );
    }

    const { messages } = (await req.json()) as { messages?: IncomingMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "РџСѓСЃС‚РѕР№ Р·Р°РїСЂРѕСЃ" }, { status: 400 });
    }

    // Р’Р°Р»РёРґР°С†РёСЏ + РѕР±СЂРµР·РєР° РёСЃС‚РѕСЂРёРё
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
      return NextResponse.json({ error: "РџСѓСЃС‚РѕР№ Р·Р°РїСЂРѕСЃ" }, { status: 400 });
    }

    // РЎС‚СЂРёРјРёРЅРі: Р±РѕС‚ РїРµС‡Р°С‚Р°РµС‚ РїРѕ РјРµСЂРµ РіРµРЅРµСЂР°С†РёРё
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      temperature: 0.4,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch {
          controller.enqueue(encoder.encode("\n\nвљ пёЏ РЎРІСЏР·СЊ СЃ РР РїСЂРµСЂРІР°Р»Р°СЃСЊ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·."));
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
      { error: "РћС€РёР±РєР° СЃРІСЏР·Рё СЃ РР. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ." },
      { status: 500 }
    );
  }
}