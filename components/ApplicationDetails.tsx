"use client";

import { FileText, ExternalLink, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { getDocumentUrl } from "@/lib/storage";
import { getUniversities, getDocuments, docLabel, formatDate } from "@/lib/application";
import type { Application, EventInfo } from "@/lib/types";

async function openDoc(path: string | null) {
  if (!path) return;
  const url = await getDocumentUrl(path);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
  else toast.error("Не удалось открыть документ");
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <span className="text-slate-400">{label}:</span> <span className="font-medium">{value}</span>
    </div>
  );
}

function EventBlock({ title, info, result }: { title: string; info?: EventInfo | null; result?: string | null }) {
  if (!info && !result) return null;
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs">
      <div className="font-semibold text-blue-800">{title}</div>
      {info && (
        <div className="mt-1 space-y-0.5 text-slate-600">
          <div>
            📅 {formatDate(info.date)} · 🕐 {info.time}
          </div>
          <div>📍 {info.place}</div>
          <div>
            🗣 {info.language} · 💻 {info.format}
          </div>
          {info.note && <div>📝 {info.note}</div>}
        </div>
      )}
      {result && (
        <div className={`mt-1 font-semibold ${result === "Прошёл" ? "text-emerald-700" : "text-red-600"}`}>
          Результат: {result}
        </div>
      )}
    </div>
  );
}

/** Полная карточка заявки — используется студентом, координатором и департаментом */
export function ApplicationDetails({ app }: { app: Application }) {
  const unis = getUniversities(app);
  const docs = getDocuments(app);
  const feedback = Object.entries(app.doc_feedback ?? {});

  return (
    <div className="space-y-3 text-sm">
      <div className="card grid gap-x-6 gap-y-1 rounded-xl p-3 text-xs sm:grid-cols-2">
        <Row label="ФИО" value={app.student_name} />
        <Row label="Дата рождения" value={formatDate(app.birth_date)} />
        <Row label="Email" value={app.student_email} />
        <Row label="Телефон" value={app.student_phone} />
        <Row label="Факультет" value={app.student_faculty} />
        <Row label="Курс / группа" value={[app.course ? `${app.course} курс` : "", app.student_group].filter(Boolean).join(", ")} />
        <Row label="Специальность" value={app.specialty} />
        <Row label="Уровень" value={app.education_level} />
        <Row label="Форма обучения" value={app.study_form} />
        <Row label="Финансирование" value={app.funding_source} />
        <Row label="GPA" value={app.student_gpa} />
        <Row label="Участие" value={app.participation} />
        <Row label="Поток" value={app.semester} />
        <Row label="Соц. положение" value={(app.social_status ?? []).join(", ") || "Нет"} />
      </div>

      {unis.length > 0 && (
        <div className="card rounded-xl p-3 text-xs">
          <div className="mb-1 font-semibold">🏫 Принимающие вузы (по приоритету)</div>
          <ol className="list-decimal space-y-0.5 pl-5">
            {unis.map((u, i) => (
              <li key={i}>
                <span className="font-medium">{u.name}</span>
                {u.country && <span className="text-slate-500"> — {u.country}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {docs.length > 0 && (
        <div className="card rounded-xl p-3 text-xs">
          <div className="mb-2 font-semibold">📎 Пакет документов</div>
          <div className="space-y-1.5">
            {docs.map((d) => (
              <div key={d.type} className="flex flex-wrap items-center gap-2 border-b border-[color:var(--border)] pb-1.5 last:border-0">
                <span className="min-w-[180px] text-slate-600">{d.label}</span>
                {d.path ? (
                  <button
                    type="button"
                    onClick={() => openDoc(d.path)}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700 hover:bg-blue-100"
                  >
                    <FileText size={11} /> {d.name ?? "файл"} <ExternalLink size={10} />
                  </button>
                ) : (
                  <span className="text-slate-400">файл не прикреплён</span>
                )}
                {d.comment && <span className="italic text-slate-500">💬 {d.comment}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="mb-1 flex items-center gap-1 font-semibold">
            <AlertTriangle size={13} /> Замечания по документам
          </div>
          <ul className="list-disc space-y-0.5 pl-5">
            {feedback.map(([t, c]) => (
              <li key={t}>
                <b>{docLabel(t, app)}</b>: {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(app.faculty_comment || app.faculty_deadline) && (
        <div className="rounded-xl bg-slate-50 p-3 text-xs">
          {app.faculty_deadline && <div>⏰ Дедлайн факультета: <b>{formatDate(app.faculty_deadline)}</b></div>}
          {app.faculty_comment && <div>💬 Комментарий факультета: {app.faculty_comment}</div>}
        </div>
      )}
      {app.dept_comment && (
        <div className="rounded-xl bg-slate-50 p-3 text-xs">💬 Комментарий департамента: {app.dept_comment}</div>
      )}

      <EventBlock title="📝 Тестирование" info={app.test_info} result={app.test_result} />
      <EventBlock title="🎤 Интервью" info={app.interview_info} result={app.interview_result} />

      {app.decision_info && (
        <div
          className={`rounded-xl border p-3 text-xs ${
            app.decision_info.decision === "Принято"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="font-semibold">🏁 Решение: {app.decision_info.decision}</div>
          {app.decision_info.university && (
            <div>
              🏫 {app.decision_info.university}
              {app.decision_info.country ? ` — ${app.decision_info.country}` : ""}
            </div>
          )}
          {app.decision_info.comment && <div>💬 {app.decision_info.comment}</div>}
        </div>
      )}
    </div>
  );
}
