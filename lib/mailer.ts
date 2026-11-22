import nodemailer from "nodemailer";
import { Resend } from "resend";

/**
 * Отправка письма: Gmail/SMTP (если заданы SMTP_USER и SMTP_PASS) — работает для любых адресов,
 * иначе Resend (без своего домена шлёт только владельцу аккаунта Resend).
 */
export async function sendMail(to: string | string[], subject: string, html: string): Promise<void> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"ARSU Мобильность" <${process.env.SMTP_USER}>`,
      to: recipients.length === 1 ? recipients[0] : undefined,
      bcc: recipients.length > 1 ? recipients : undefined,
      subject,
      html,
    });
    return;
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to: recipients,
      subject,
      html,
    });
    if (error) {
      throw new Error(
        `${error.message}. Подключите Gmail SMTP (SMTP_USER и SMTP_PASS в Vercel), чтобы письма доходили всем`
      );
    }
    return;
  }

  throw new Error("Почта не настроена: задайте SMTP_USER и SMTP_PASS в Vercel → Environment Variables");
}
