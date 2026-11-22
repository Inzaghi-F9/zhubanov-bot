// Единый источник правды по статусам заявки.

export const STATUS = {
  FACULTY_REVIEW: "На проверке (факультет)",
  FACULTY_FIX: "На исправление (факультет)",
  FACULTY_RECOMMENDED: "Рекомендован факультетом",
  FACULTY_REJECTED: "Не рекомендован факультетом",
  DEPARTMENT_REVIEW: "На рассмотрении (департамент)",
  DEPARTMENT_FIX: "На исправление (департамент)",
  DEPARTMENT_APPROVED: "Одобрено департаментом",
  DEPARTMENT_REJECTED: "Отклонено департаментом",
  TEST: "Приглашены на тестирование",
  TEST_PASSED: "Тестирование пройдено",
  TEST_FAILED: "Тестирование не пройдено",
  INTERVIEW: "Приглашены на интервью",
  INTERVIEW_PASSED: "Интервью пройдено",
  INTERVIEW_FAILED: "Интервью не пройдено",
  ACCEPTED: "Принято",
  NOT_ACCEPTED: "Не принято",
  LEGACY_ERROR: "Ошибка",
  LEGACY_FACULTY_REJECTED: "Отклонён факультетом",
} as const;

export type DbStatus = (typeof STATUS)[keyof typeof STATUS];

/** Статусы этапа факультета (ещё не рекомендованы) */
export const FACULTY_STAGE: string[] = [
  STATUS.FACULTY_REVIEW,
  STATUS.FACULTY_FIX,
  STATUS.FACULTY_REJECTED,
  STATUS.LEGACY_FACULTY_REJECTED,
];

/** Из этих статусов студент может исправить и заново подать заявку */
export const RESUBMITTABLE: string[] = [
  STATUS.FACULTY_FIX,
  STATUS.FACULTY_REJECTED,
  STATUS.LEGACY_FACULTY_REJECTED,
  STATUS.DEPARTMENT_FIX,
  STATUS.LEGACY_ERROR,
];

/** Заявка была рекомендована факультетом (дошла до департамента) */
export const isRecommended = (s: string) => !FACULTY_STAGE.includes(s);

export type GroupKey =
  | "review"
  | "fix"
  | "recommended"
  | "department"
  | "test"
  | "interview"
  | "accepted"
  | "rejected";

export const GROUPS: Record<GroupKey, { label: string; statuses: string[] }> = {
  review: { label: "На проверке факультета", statuses: [STATUS.FACULTY_REVIEW] },
  fix: {
    label: "На исправлении",
    statuses: [STATUS.FACULTY_FIX, STATUS.DEPARTMENT_FIX, STATUS.LEGACY_ERROR],
  },
  recommended: { label: "Рекомендованы", statuses: [STATUS.FACULTY_RECOMMENDED] },
  department: {
    label: "На рассмотрении департамента",
    statuses: [STATUS.DEPARTMENT_REVIEW, STATUS.DEPARTMENT_APPROVED],
  },
  test: {
    label: "Тестирование",
    statuses: [STATUS.TEST, STATUS.TEST_PASSED, STATUS.TEST_FAILED],
  },
  interview: {
    label: "Интервью",
    statuses: [STATUS.INTERVIEW, STATUS.INTERVIEW_PASSED, STATUS.INTERVIEW_FAILED],
  },
  accepted: { label: "Принято", statuses: [STATUS.ACCEPTED] },
  rejected: {
    label: "Отклонено / не принято",
    statuses: [
      STATUS.FACULTY_REJECTED,
      STATUS.LEGACY_FACULTY_REJECTED,
      STATUS.DEPARTMENT_REJECTED,
      STATUS.NOT_ACCEPTED,
    ],
  },
};

export const GROUP_KEYS = Object.keys(GROUPS) as GroupKey[];
export const inGroup = (s: string, k: GroupKey) => GROUPS[k].statuses.includes(s);

/** Этапы визуального таймлайна */
export const STAGES = [
  "Проверка факультетом",
  "Рекомендация факультета",
  "Рассмотрение департаментом",
  "Тестирование",
  "Интервью",
  "Итоговое решение",
];

export type StageState = "active" | "done" | "fix" | "failed";

const STAGE_MAP: Record<string, [number, StageState]> = {
  [STATUS.FACULTY_REVIEW]: [0, "active"],
  [STATUS.FACULTY_FIX]: [0, "fix"],
  [STATUS.FACULTY_REJECTED]: [0, "failed"],
  [STATUS.LEGACY_FACULTY_REJECTED]: [0, "failed"],
  [STATUS.FACULTY_RECOMMENDED]: [1, "done"],
  [STATUS.DEPARTMENT_REVIEW]: [2, "active"],
  [STATUS.DEPARTMENT_FIX]: [2, "fix"],
  [STATUS.LEGACY_ERROR]: [2, "fix"],
  [STATUS.DEPARTMENT_APPROVED]: [2, "done"],
  [STATUS.DEPARTMENT_REJECTED]: [2, "failed"],
  [STATUS.TEST]: [3, "active"],
  [STATUS.TEST_PASSED]: [3, "done"],
  [STATUS.TEST_FAILED]: [3, "failed"],
  [STATUS.INTERVIEW]: [4, "active"],
  [STATUS.INTERVIEW_PASSED]: [4, "done"],
  [STATUS.INTERVIEW_FAILED]: [4, "failed"],
  [STATUS.ACCEPTED]: [5, "done"],
  [STATUS.NOT_ACCEPTED]: [5, "failed"],
};

export function stageOf(status: string): { index: number; state: StageState } {
  const [index, state] = STAGE_MAP[status] ?? [0, "active"];
  return { index, state };
}

export type StatusKind = "success" | "warning" | "danger" | "info";

export function statusKind(status: string): StatusKind {
  const { state } = stageOf(status);
  if (state === "failed") return "danger";
  if (state === "done") return "success";
  if (state === "fix") return "warning";
  return "info";
}

const KIND_CLASSES: Record<StatusKind, string> = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

export const STATUS_BADGE_CLASS = (status: string): string => KIND_CLASSES[statusKind(status)];
