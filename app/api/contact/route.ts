import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const toEmail = process.env.CONTACT_TO_EMAIL ?? "mobility@arsu.kz";

    // Отправляем письмо администратору
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `[FEEDBACK] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1e293b;">
          <h2>Новое сообщение с сайта АРСУ Мобильность:</h2>
          <p><strong>Имя:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Тема:</strong> ${subject}</p>
          <hr style="border: 1px solid #e2e8f0;">
          <p><strong>Сообщение:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `
    });

    // Отправляем подтверждение пользователю
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "✅ Ваше сообщение получено — ARSU",
      html: `
        <div style="font-family: Arial, sans-serif; color: #1e293b;">
          <h2>Спасибо за обращение!</h2>
          <p>Здравствуйте, ${name}! 👋</p>
          <p>Мы получили ваше сообщение с темой: <strong>"${subject}"</strong></p>
          <p>Отдел академической мобильности АРСУ рассмотрит его и ответит вам в ближайшее время.</p>
          <hr style="border: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 13px;">Если у вас есть срочный вопрос, свяжитесь с нами: +7 (7132) 54-05-05, каб. 205 (пр. А. Жангильдина, 34, Актобе).</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
