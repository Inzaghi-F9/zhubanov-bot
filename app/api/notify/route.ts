import { NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { STATUS, type DbStatus } from "@/lib/statuses";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TEMPLATES: Record<DbStatus, { subject: string; title: string; color: string; hint: string }> = {
  [STATUS.FACULTY_REVIEW]: {
    subject: "📩 Заявка принята на проверку — ARSU",
    title: "Заявка принята на проверку",
    color: "#2563eb",
    hint: "Ваша заявка передана на ваш факультет. Ожидайте рекомендации деканата.",
  },
  [STATUS.FACULTY_RECOMMENDED]: {
    subject: "✅ Факультет рекомендовал вашу заявку — ARSU",
    title: "Факультет рекомендовал вашу заявку",
    color: "#22c55e",
    hint: "Заявка направлена в департамент академической мобильности.",
  },
  [STATUS.FACULTY_REJECTED]: {
    subject: "❌ Заявка отклонена факультетом — ARSU",
    title: "Заявка отклонена факультетом",
    color: "#ef4444",
    hint: "Исправьте указанную причину в личном кабинете и подайте заявку повторно.",
  },
  [STATUS.DEPARTMENT_REVIEW]: {
    subject: "🏛 Заявка на рассмотрении департамента — ARSU",
    title: "Заявка на рассмотрении департамента",
    color: "#7c3aed",
    hint: "Департамент рассматривает вашу заявку. Ожидайте приглашения на тестирование.",
  },
  [STATUS.TEST]: {
    subject: "📝 Вас пригласили на тестирование — ARSU",
    title: "Приглашение на тестирование",
    color: "#f59e0b",
    hint: "Вас пригласили на тестирование. Дату и место сообщат дополнительно.",
  },
  [STATUS.INTERVIEW]: {
    subject: "🎤 Вас пригласили на интервью — ARSU",
    title: "Приглашение на интервью",
    color: "#0d9488",
    hint: "Вас пригласили на конкурсное интервью. Подготовьтесь и возьмите оригиналы документов.",
  },
  [STATUS.ACCEPTED]: {
    subject: "🎉 Ваша заявка принята — ARSU",
    title: "Поздравляем! Заявка принята",
    color: "#16a34a",
    hint: "Ваши документы приняты. Ожидайте дальнейших инструкций по академической мобильности.",
  },
  [STATUS.REJECTED]: {
    subject: "❌ В заявке обнаружена ошибка — ARSU",
    title: "В заявке обнаружена ошибка",
    color: "#dc2626",
    hint: "Исправьте указанную причину в личном кабинете и подайте документы повторно.",
  },
};

export async function POST(req: Request) {
  try {
    // 1. Проверяем авторизацию
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    }

    const { studentEmail, studentName, status, comment } = (await req.json()) as {
      studentEmail?: string;
      studentName?: string;
      status?: DbStatus;
      comment?: string;
    };

    if (!studentEmail || !studentName || !status) {
      return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
    }

    // Студент может вызвать /api/notify только при подаче своей заявки (статус FACULTY_REVIEW на свой email)
    // Все остальные статусы могут отправлять только преподаватели (faculty) и администраторы (admin)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isStaff = profile?.role === "faculty" || profile?.role === "admin";
    const isSelfSubmission =
      status === STATUS.FACULTY_REVIEW &&
      user.email?.toLowerCase() === studentEmail.toLowerCase();

    if (!isStaff && !isSelfSubmission) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const tpl = TEMPLATES[status];
    if (!tpl) {
      return NextResponse.json({ error: `Неизвестный статус: ${status}` }, { status: 400 });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Университет им. К. Жубанова</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Здравствуйте, ${studentName}!</h2>
          <p style="color: #64748b; font-size: 16px;">Статус вашей заявки на академическую мобильность обновлён:</p>
          <div style="padding: 20px; border-radius: 10px; margin: 20px 0; background: #f8fafc; border-left: 5px solid ${tpl.color};">
            <strong style="font-size: 18px; color: ${tpl.color};">${status}</strong>
            ${comment ? `<p style="color: #64748b; margin-top: 10px;">Комментарий: ${comment}</p>` : ""}
          </div>
          <p style="color: #64748b;">${tpl.hint}</p>
          <a href="${SITE_URL}/dashboard"
            style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Перейти в личный кабинет
          </a>
        </div>
      </div>
    `;

    // Вариант А: Если настроен Gmail / корпоративный SMTP (работает для ЛЮБЫХ адресов студентов без покупки домена!)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: Number(process.env.SMTP_PORT ?? 465) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"ARSU Мобильность" <${process.env.SMTP_USER}>`,
        to: studentEmail,
        subject: tpl.subject,
        html,
      });

      return NextResponse.json({ success: true, provider: "smtp" });
    }

    // Вариант Б: Resend API (требует привязанный домен в Resend для отправки на чужие адреса)
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Не задан SMTP_USER/SMTP_PASS или RESEND_API_KEY в настройках сервера" },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to: studentEmail,
      subject: tpl.subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        {
          error:
            error.message ||
            "Resend отклонил отправку (на бесплатном тарифе без своего домена письма уходят только владельцу аккаунта Resend. Подключите SMTP_USER и SMTP_PASS от Gmail!)",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, provider: "resend", id: data?.id });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось отправить письмо" },
      { status: 500 }
    );
  }
}
