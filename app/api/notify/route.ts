import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { studentEmail, studentName, status, comment } = await req.json();

    const getEmailContent = (status: string, comment: string) => {
      switch (status) {
        case "Принято":
          return {
            subject: "✅ Ваша заявка принята — ARSU",
            color: "#22c55e",
            bg: "#f0fdf4",
            border: "#22c55e",
            title: "✅ Принято",
            message: "Поздравляем! Ваши документы приняты департаментом. Ожидайте дальнейших инструкций.",
          };
        case "Рекомендован факультетом":
          return {
            subject: "🎓 Вы рекомендованы факультетом — ARSU",
            color: "#0d9488",
            bg: "#f0fdfa",
            border: "#0d9488",
            title: "🎓 Рекомендован факультетом",
            message: "Факультет рассмотрел вашу заявку и рекомендует вас для участия в программе академической мобильности. Ваша заявка передана в департамент для дальнейшего рассмотрения.",
          };
        case "Отклонён факультетом":
          return {
            subject: "❌ Заявка отклонена факультетом — ARSU",
            color: "#ef4444",
            bg: "#fef2f2",
            border: "#ef4444",
            title: "❌ Отклонён факультетом",
            message: comment ? `Факультет отклонил вашу заявку. Причина: ${comment}` : "Факультет отклонил вашу заявку. Для уточнения причин обратитесь на факультет.",
          };
        case "Приглашены на тестирование":
          return {
            subject: "📝 Вы приглашены на тестирование — ARSU",
            color: "#7c3aed",
            bg: "#faf5ff",
            border: "#7c3aed",
            title: "📝 Приглашение на тестирование",
            message: comment || "Вы приглашены на тестирование в рамках программы академической мобильности. Следите за уведомлениями — дата и время будут сообщены дополнительно.",
          };
        case "Приглашены на интервью":
          return {
            subject: "🎤 Вы приглашены на интервью — ARSU",
            color: "#2563eb",
            bg: "#eff6ff",
            border: "#2563eb",
            title: "🎤 Приглашение на интервью",
            message: comment || "Вы приглашены на интервью в рамках программы академической мобильности. Следите за уведомлениями — дата и время будут сообщены дополнительно.",
          };
        case "Ошибка":
          return {
            subject: "⚠️ Ошибка в заявке — ARSU",
            color: "#f59e0b",
            bg: "#fffbeb",
            border: "#f59e0b",
            title: "⚠️ Требуется исправление",
            message: comment ? `В вашей заявке обнаружена ошибка. Причина: ${comment}` : "В вашей заявке обнаружена ошибка. Пожалуйста, исправьте и подайте повторно.",
          };
        default:
          return {
            subject: `Обновление статуса заявки — ARSU`,
            color: "#64748b",
            bg: "#f8fafc",
            border: "#64748b",
            title: status,
            message: "Статус вашей заявки был обновлён.",
          };
      }
    };

    const content = getEmailContent(status, comment);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: studentEmail,
      subject: content.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">🎓 Университет им. К. Жубанова</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Программа академической мобильности</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b;">Здравствуйте, ${studentName}!</h2>
            <p style="color: #64748b; font-size: 15px;">Статус вашей заявки на академическую мобильность изменён.</p>
            <div style="padding: 20px; border-radius: 10px; margin: 20px 0; background: ${content.bg}; border-left: 5px solid ${content.border};">
              <strong style="font-size: 18px; color: ${content.color};">${content.title}</strong>
              <p style="color: #64748b; margin-top: 10px; font-size: 14px;">${content.message}</p>
            </div>
            <a href="https://zhubanov-bot-829u.vercel.app/dashboard"
              style="display: inline-block; margin-top: 10px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
              Перейти в личный кабинет →
            </a>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
            Это автоматическое уведомление от системы ARSU Mobility
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}