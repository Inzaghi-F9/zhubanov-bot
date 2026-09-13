// Единый источник правды по статусам заявки.
// Раньше эти строки были разбросаны по трём страницам — теперь они здесь.

export const STATUS = {
  FACULTY_REVIEW: "На проверке (факультет)",
  FACULTY_RECOMMENDED: "Рекомендован факультетом",
  FACULTY_REJECTED: "Отклонён факультетом",
  DEPARTMENT_REVIEW: "На рассмотрении (департамент)",
  TEST: "Приглашены на тестирование",
  INTERVIEW: "Приглашены на интервью",
  ACCEPTED: "Принято",
  REJECTED: "Ошибка",
} as const;

export type DbStatus = (typeof STATUS)[keyof typeof STATUS];

/** Стадии, которые обрабатывает факультет */
export const FACULTY_STATUSES: DbStatus[] = [
  STATUS.FACULTY_REVIEW,
  STATUS.FACULTY_RECOMMENDED,
  STATUS.FACULTY_REJECTED,
  STATUS.DEPARTMENT_REVIEW,
  STATUS.TEST,
  STATUS.INTERVIEW,
  STATUS.ACCEPTED,
  STATUS.REJECTED,
];

/** Заявки, попадающие в админку (после факультета) */
export const ADMIN_STATUSES: DbStatus[] = [
  STATUS.FACULTY_RECOMMENDED,
  STATUS.DEPARTMENT_REVIEW,
  STATUS.TEST,
  STATUS.INTERVIEW,
  STATUS.ACCEPTED,
  STATUS.REJECTED,
];

/** Позитивный путь заявки для визуального таймлайна */
export const STATUS_FLOW: DbStatus[] = [
  STATUS.FACULTY_REVIEW,
  STATUS.FACULTY_RECOMMENDED,
  STATUS.DEPARTMENT_REVIEW,
  STATUS.TEST,
  STATUS.INTERVIEW,
  STATUS.ACCEPTED,
];

export type StatusKind = "success" | "warning" | "danger";

export function statusKind(status: string): StatusKind {
  if (status === STATUS.ACCEPTED || status === STATUS.FACULTY_RECOMMENDED) return "success";
  if (status === STATUS.REJECTED || status === STATUS.FACULTY_REJECTED) return "danger";
  return "warning";
}

const KIND_CLASSES: Record<StatusKind, string> = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-red-100 text-red-700 border-red-200",
};

export const STATUS_BADGE_CLASS = (status: string): string => KIND_CLASSES[statusKind(status)];

export const STATUS_DOT_CLASS = (status: string): string =>
  ({ success: "bg-emerald-500", warning: "bg-amber-500", danger: "bg-red-500" })[statusKind(status)];

export const STATUS_ROW_CLASS = (status: string): string =>
  ({ success: "bg-emerald-50", warning: "bg-amber-50/60", danger: "bg-red-50" })[statusKind(status)];