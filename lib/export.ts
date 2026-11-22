import type { Application } from "./types";
import { getUniversities, formatDate } from "./application";

export type Cell = string | number | null | undefined;

/** Скачивание CSV (UTF-8 BOM + «;» — корректно открывается в Excel с кириллицей) */
export function downloadCsv(filename: string, headers: string[], rows: Cell[][]) {
  const esc = (v: Cell) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const FULL_HEADERS = [
  "№",
  "ФИО студента",
  "Email",
  "Телефон",
  "Дата рождения",
  "Факультет",
  "Курс",
  "Группа",
  "Специальность (шифр)",
  "Уровень образования",
  "Форма обучения",
  "Источник финансирования",
  "GPA",
  "Участие",
  "Поток (семестр)",
  "Вуз 1",
  "Страна 1",
  "Вуз 2",
  "Страна 2",
  "Вуз 3",
  "Страна 3",
  "Социальное положение",
  "Статус",
  "Дедлайн факультета",
  "Комментарий факультета",
  "Комментарий департамента",
  "Результат теста",
  "Результат интервью",
  "Решение",
  "Вуз зачисления",
  "Страна зачисления",
  "Дата подачи",
];

export function fullRow(a: Application, i: number): Cell[] {
  const u = getUniversities(a);
  return [
    i + 1,
    a.student_name,
    a.student_email,
    a.student_phone,
    formatDate(a.birth_date),
    a.student_faculty,
    a.course,
    a.student_group,
    a.specialty,
    a.education_level,
    a.study_form,
    a.funding_source,
    a.student_gpa,
    a.participation,
    a.semester,
    u[0]?.name,
    u[0]?.country,
    u[1]?.name,
    u[1]?.country,
    u[2]?.name,
    u[2]?.country,
    (a.social_status ?? []).join(", ") || "Нет",
    a.status,
    formatDate(a.faculty_deadline),
    a.faculty_comment,
    a.dept_comment,
    a.test_result,
    a.interview_result,
    a.decision_info?.decision,
    a.decision_info?.university,
    a.decision_info?.country,
    formatDate(a.created_at),
  ];
}
