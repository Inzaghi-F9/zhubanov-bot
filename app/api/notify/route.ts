import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/statuses";
import { sendMail } from "@/lib/mailer";
import { getUniversities, docLabel, formatDate } from "@/lib/application";
import type { Application, EventInfo } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TEMPLATES: Record<string, { subject: string; color: string; hint: string }> = {
  [STATUS.FACULTY_REVIEW]: {
    subject: "📩 Заявка принята на проверку факультетом — ARSU",
    color: "#2563eb",
    hint: "Ваша заявка передана координатору факультета. Ожидайте результата проверки.",
  },
  [STATUS.FACULTY_FIX]: {
    subject: "✏️ Пакет документов нужно исправить — ARSU",
    color: "#f59e0b",
    hint: "Координатор факультета вернул документы на исправление. Исправьте замечания в личном кабинете и отправьте заявку повторно.",
  },
  [STATUS.FACULTY_RECOMMENDED]: {
    subject: "✅ Факультет рекомендовал вашу заявку — ARSU",
    color: "#22c55e",
    hint: "Заявка передана в департамент академической мобильности.",
  },
  [STATUS.FACULTY_REJECTED]: {
    subject: "❌ Заявка не рекомендована факультетом — ARSU",
    color: "#ef4444",
    hint: "Ознакомьтесь с причиной, исправьте и подайте заявку заново через личный кабинет.",
  },
  [STATUS.DEPARTMENT_REVIEW]: {
    subject: "🏛 Заявка на рассмотрении департамента — ARSU",
    color: "#7c3aed",
    hint: "Департамент академической мобильности рассматривает вашу заявку.",
  },
  [STATUS.DEPARTMENT_FIX]: {
    subject: "✏️ Департамент просит исправить документы — ARSU",
    color: "#f59e0b",
    hint: "Исправьте указанные ошибки в личном кабинете и отправьте заявку повторно.",
  },
  [STATUS.DEPARTMENT_APPROVED]: {
    subject: "✅ Заявка одобрена департаментом — ARSU",
    color: "#16a34a",
    hint: "Ожидайте приглашения на тестирование.",
  },
  [STATUS.DEPARTMENT_REJECTED]: {
    subject: "❌ Заявка отклонена департаментом — ARSU",
    color: "#dc2626",
    hint: "К сожалению, заявка отклонена. Причина указана ниже.",
  },
  [STATUS.TEST]: {
    subject: "📝 Приглашение на тестирование — ARSU",
    color: "#f59e0b",
    hint: "Вы приглашены на тестирование. Детали ниже — не опаздывайте и возьмите удостоверение личности.",
  },
  [STATUS.TEST_PASSED]: {
    subject: "🎉 Вы прошли тестирование — ARSU",
    color: "#16a34a",
    hint: "Поздравляем! Ожидайте приглашения на интервью.",
  },
  [STATUS.TEST_FAILED]: {
    subject: "Результат тестирования — ARSU",
    color: "#dc2626",
    hint: "К сожалению, тестирование не пройдено.",
  },
  [STATUS.INTERVIEW]: {
    subject: "🎤 Приглашение на интервью — ARSU",
    color: "#0d9488",
    hint: "Вы приглашены на интервью. Детали ниже. Возьмите оригиналы документов.",
  },
  [STATUS.INTERVIEW_PASSED]: {
    subject: "🎉 Вы прошли интервью — ARSU",
    color: "#16a34a",
    hint: "Поздравляем! Ожидайте итогового решения департамента.",
  },
  [STATUS.INTERVIEW_FAILED]: {
    subject: "Результат интервью — ARSU",
    color: "#dc2626",
    hint: "К сожалению, интервью не пройдено.",
  },
  [STATUS.ACCEPTED]: {
    subject: "🎉 Решение: вы приняты в программу мобильности — ARSU",
    color: "#16a34a",
    hint: "Поздравляем! Ожидайте дальнейших инструкций по оформлению документов.",
  },
  [STATUS.NOT_ACCEPTED]: {
    subject: "Итоговое решение по заявке — ARSU",
    color: "#dc2626",
    hint: "К сожалению, по итогам конкурса заявка не принята.",
  },
};

function esc(v: unknown): string {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

function box(color: string, inner: string) {
  return `<div style="padding:16px;border-radius:10px;margin:16px 0;background:#f8fafc;border-left:5px solid ${color};color:#334155;font-size:14px;line-height:1.7">${inner}</div>`;
}

function eventHtml(title: string, info?: EventInfo | null) {
  if (!info) return "";
  return box(
    "#2563eb",
    `<strong>${title}</strong><br>📅 Дата: ${esc(formatDate(info.date))}<br>🕐 Время: ${esc(info.time)}<br>📍 Место: ${esc(
      info.place
    )}<br>🗣 Язык: ${esc(info.language)}<br>💻 Формат: ${esc(info.format)}${
      info.note ? `<br>📝 ${esc(info.note)}` : ""
    }`
  );
}

function detailsHtml(app: Application): string {
  const s = app.status;
  const parts: string[] = [];
  const facultyStatuses: string[] = [STATUS.FACULTY_FIX, STATUS.FACULTY_RECOMMENDED, STATUS.FACULTY_REJECTED];
  const comment = facultyStatuses.includes(s) ? app.faculty_comment : app.dept_comment;

  if (s === STATUS.FACULTY_FIX || s === STATUS.DEPARTMENT_FIX) {
    const fb = Object.entries(app.doc_feedback ?? {});
    if (fb.length) {
      parts.push(
        box(
          "#f59e0b",
          `<strong>Что нужно исправить:</strong><ul style="margin:8px 0 0;padding-left:18px">${fb
            .map(([t, c]) => `<li><b>${esc(docLabel(t, app))}</b>: ${esc(c)}</li>`)
            .join("")}</ul>`
        )
      );
    }
  }
  if (s === STATUS.FACULTY_RECOMMENDED && app.faculty_deadline) {
    parts.push(box("#22c55e", `⏰ Дедлайн: <b>${esc(formatDate(app.faculty_deadline))}</b>`));
  }
  if (s === STATUS.TEST) parts.push(eventHtml("Детали тестирования", app.test_info));
  if (s === STATUS.INTERVIEW) parts.push(eventHtml("Детали интервью", app.interview_info));
  if ((s === STATUS.ACCEPTED || s === STATUS.NOT_ACCEPTED) && app.decision_info) {
    const d = app.decision_info;
    parts.push(
      box(
        s === STATUS.ACCEPTED ? "#16a34a" : "#dc2626",
        `<strong>Решение: ${esc(d.decision)}</strong>${
          d.university ? `<br>🏫 Вуз: ${esc(d.university)}` : ""
        }${d.country ? `<br>🌍 Страна: ${esc(d.country)}` : ""}`
      )
    );
  }
  if (comment) parts.push(`<p style="color:#475569">💬 Комментарий: ${esc(comment)}</p>`);
  return parts.join("");
}

function layout(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:20px">🎓 Университет им. К. Жубанова — Академическая мобильность</h1>
      </div>
      <div style="background:white;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <h2 style="color:#1e293b;margin-top:0">${title}</h2>
        ${body}
      </div>
    </div>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold">${label}</a>`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

    const { applicationId } = (await req.json()) as { applicationId?: string };
    if (!applicationId) return NextResponse.json({ error: "Не указана заявка" }, { status: 400 });

    // RLS гарантирует: студент видит только свою заявку, факультет — только своих студентов
    const { data: app } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single<Application>();
    if (!app) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const isStaff = profile?.role === "faculty" || profile?.role === "admin";
    const studentAllowed: string[] = [STATUS.FACULTY_REVIEW, STATUS.DEPARTMENT_REVIEW];

    if (!isStaff && !(app.student_id === user.id && studentAllowed.includes(app.status))) {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const tpl = TEMPLATES[app.status] ?? {
      subject: "Статус заявки обновлён — ARSU",
      color: "#2563eb",
      hint: "",
    };

    // 1. Письмо студенту
    await sendMail(
      app.student_email,
      tpl.subject,
      layout(
        `Здравствуйте, ${esc(app.student_name)}!`,
        `<p style="color:#64748b">Статус вашей заявки на академическую мобильность (${esc(app.semester ?? "")}):</p>
         ${box(tpl.color, `<strong style="font-size:17px;color:${tpl.color}">${esc(app.status)}</strong>`)}
         ${detailsHtml(app)}
         <p style="color:#64748b">${tpl.hint}</p>
         ${button(`${SITE_URL}/dashboard`, "Перейти в личный кабинет")}`
      )
    );

    // 2. Уведомление координаторам / департаменту
    let staffEmails: string[] = [];
    let staffTitle = "";
    let staffLink = `${SITE_URL}/faculty`;

    if (app.status === STATUS.FACULTY_REVIEW && app.student_faculty) {
      const { data } = await supabase.rpc("coordinator_emails", { fac: app.student_faculty });
      staffEmails = ((data ?? []) as { email: string }[]).map((r) => r.email);
      staffTitle = "Новая заявка на проверку факультетом";
    } else if (
      app.status === STATUS.FACULTY_RECOMMENDED ||
      (app.status === STATUS.DEPARTMENT_REVIEW && !isStaff)
    ) {
      const { data } = await supabase.rpc("admin_emails");
      staffEmails = ((data ?? []) as { email: string }[]).map((r) => r.email);
      staffTitle =
        app.status === STATUS.FACULTY_RECOMMENDED
          ? "Факультет рекомендовал студента"
          : "Студент исправил документы для департамента";
      staffLink = `${SITE_URL}/admin`;
    }

    let staffError: string | null = null;
    if (staffEmails.length) {
      const unis = getUniversities(app)
        .map((u) => `${esc(u.name)}${u.country ? ` (${esc(u.country)})` : ""}`)
        .join(", ");
      try {
        await sendMail(
          staffEmails,
          `🔔 ${staffTitle}: ${app.student_name} — ARSU`,
          layout(
            staffTitle,
            box(
              "#2563eb",
              `<b>${esc(app.student_name)}</b><br>🏛 ${esc(app.student_faculty ?? "")}, ${esc(
                app.course ? `${app.course} курс` : ""
              )} ${esc(app.student_group ?? "")}<br>📚 ${esc(app.specialty ?? "")}<br>🏫 ${unis}<br>📅 ${esc(
                app.semester ?? ""
              )}`
            ) + button(staffLink, "Открыть кабинет")
          )
        );
      } catch (e) {
        staffError = e instanceof Error ? e.message : "staff mail error";
      }
    }

    return NextResponse.json({ success: true, staffNotified: staffEmails.length, staffError });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось отправить письмо" },
      { status: 500 }
    );
  }
}
