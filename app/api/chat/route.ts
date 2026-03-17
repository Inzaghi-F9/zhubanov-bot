import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Ты — официальный ИИ-ассистент университета им. К. Жубанова. ПРАВИЛО: Отвечай СТРОГО на том языке, на котором к тебе обратился пользователь. Если спросили на казахском — отвечай только на казахском. Если на русском — только на русском. Не смешивай языки в одном ответе.Ты — узкоспециализированный помощник университета им. К. Жубанова. Тебе ЗАПРЕЩЕНО отвечать на любые вопросы, не связанные с университетом, поступлением, документами или студенческой жизнью. Если тебя просят написать код, решить задачу по математике или обсудить погоду, ты должен вежливо ответить: «Я — ассистент университета Жубанова и консультирую только по вопросам обучения в нашем ВУЗе». Твоя база знаний: [добавь сюда еще раз кратко данные об универе]."
        },
        ...messages,
      ],
      model: "llama-3.3-70b-versatile",
    });

    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ text: "Ошибка связи с ИИ. Попробуйте позже." }, { status: 500 });
  }
}