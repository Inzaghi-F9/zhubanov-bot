import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { studentEmail, studentName, status, comment } = await req.json();

    const isAccepted = status === "Принято";

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: studentEmail,
      subject: isAccepted
        ? "✅ Ваша заявка принята — ARSU"
        : "❌ Ошибка в заявке — ARSU",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Университет им. К. Жубанова</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b;">Здравствуйте, ${studentName}!</h2>
            <p style="color: #64748b; font-size: 16px;">Статус вашей заявки на академическую мобильность изменён.</p>
            <div style="padding: 20px; border-radius: 10px; margin: 20px 0; background: ${isAccepted ? '#f0fdf4' : '#fef2f2'}; border-left: 5px solid ${isAccepted ? '#22c55e' : '#ef4444'};">
              <strong style="font-size: 18px; color: ${isAccepted ? '#16a34a' : '#dc2626'};">
                ${isAccepted ? '✅ Принято' : '❌ Ошибка'}
              </strong>
              ${comment ? `<p style="color: #64748b; margin-top: 10px;">Причина: ${comment}</p>` : ''}
            </div>
            ${isAccepted
              ? '<p style="color: #64748b;">Поздравляем! Ваши документы приняты. Ожидайте дальнейших инструкций.</p>'
              : '<p style="color: #64748b;">Пожалуйста, исправьте ошибку и подайте документы повторно.</p>'
            }
            <a href="https://zhubano-bot.netlify.app/dashboard" 
              style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Перейти в личный кабинет
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}