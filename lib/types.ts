export type Role = "student" | "faculty" | "admin";

export const FACULTIES = [
  "Физико-математический факультет (ИТ)",
  "Технический факультет",
  "Факультет экономики и права",
  "Филологический факультет",
  "Факультет иностранных языков",
  "Факультет естествознания",
  "Исторический факультет",
  "Педагогический факультет",
  "Профессионально-творческий факультет",
] as const;

export const SEMESTERS = [
  "Осень 2026 (1 семестр)",
  "Весна 2027 (2 семестр)",
  "Осень 2027 (1 семестр)",
  "Весна 2028 (2 семестр)",
] as const;

export const CURRENT_SEMESTER = SEMESTERS[1];

export const EDUCATION_LEVELS = ["Бакалавриат", "Магистратура"] as const;
export const STUDY_FORMS = ["Грант", "Платное"] as const;
export const PARTICIPATION = ["Впервые", "Второй раз", "Третий раз"] as const;
export const COURSES = ["1", "2", "3", "4"] as const;

export const FUNDING = {
  REPUBLIC: "Республиканский бюджет",
  UNIVERSITY: "За счёт университета",
  OWN: "За свой счёт",
} as const;

export const SOCIAL_STATUSES = [
  "Многодетная семья",
  "Инвалидность",
  "Ребёнок-сирота / без попечения родителей",
] as const;

export const LANGUAGES = ["Казахский", "Русский", "Английский"] as const;
export const EVENT_FORMATS = ["Офлайн (очно)", "Онлайн"] as const;
export const MAX_UNIVERSITIES = 3;

export interface DocumentType {
  type: string;
  label: string;
  required: boolean;
}

/** Пакет документов: для каждого — файл или комментарий */
export const DOCUMENT_TYPES: DocumentType[] = [
  { type: "transcript", label: "Транскрипт (выписка оценок с GPA)", required: true },
  { type: "application", label: "Заявление на участие", required: true },
  { type: "id_card", label: "Удостоверение личности / паспорт", required: true },
  { type: "motivation", label: "Мотивационное письмо", required: true },
  { type: "recommendation", label: "Рекомендательное письмо", required: false },
  { type: "language", label: "Сертификат знания языка (IELTS, TOEFL и др.)", required: false },
  { type: "medical", label: "Медицинская справка 086-у", required: false },
];

export const SOCIAL_DOCUMENT: DocumentType = {
  type: "social",
  label: "Документ, подтверждающий социальное положение",
  required: true,
};

export const ALL_DOCUMENT_TYPES: DocumentType[] = [...DOCUMENT_TYPES, SOCIAL_DOCUMENT];

export interface UniversityChoice {
  name: string;
  country: string;
}

export interface AppDocument {
  type: string;
  label: string;
  name: string | null;
  path: string | null;
  comment: string;
}

export interface EventInfo {
  date: string;
  time: string;
  place: string;
  language: string;
  format: string;
  note?: string;
}

export interface DecisionInfo {
  decision: string;
  university: string;
  country: string;
  comment: string;
}

export interface Profile {
  id: string;
  email: string;
  role: Role;
  name: string;
  group_name: string | null;
  faculty?: string | null;
  phone?: string | null;
  gpa?: number | null;
  course?: number | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_group?: string | null;
  student_faculty?: string | null;
  student_phone?: string | null;
  student_gpa?: number | null;
  semester?: string;
  specialty?: string | null;
  study_form?: string | null;
  funding_source?: string | null;
  education_level?: string | null;
  birth_date?: string | null;
  course?: number | null;
  universities?: UniversityChoice[] | null;
  country?: string | null;
  social_status?: string[] | null;
  participation?: string | null;
  documents?: AppDocument[] | null;
  doc_feedback?: Record<string, string> | null;
  faculty_deadline?: string | null;
  test_info?: EventInfo | null;
  test_result?: string | null;
  interview_info?: EventInfo | null;
  interview_result?: string | null;
  decision_info?: DecisionInfo | null;
  university_name: string;
  purpose: string;
  date_from?: string | null;
  date_to?: string | null;
  status: string;
  faculty_comment: string;
  dept_comment: string;
  file_names: string[];
  file_paths: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface FundingOption {
  value: string;
  allowed: boolean;
  hint: string;
}

/**
 * Правила источника финансирования:
 * - Республиканский бюджет — только осенний семестр
 * - За счёт университета — если студент учится на гранте
 * - За свой счёт — платник или бакалавр, участвующий повторно
 */
export function fundingOptions(f: {
  semester: string;
  study_form: string;
  education_level: string;
  participation: string;
}): FundingOption[] {
  const autumn = f.semester.startsWith("Осень");
  const grant = f.study_form === "Грант";
  const repeatBachelor = f.education_level === "Бакалавриат" && f.participation !== "Впервые";

  return [
    {
      value: FUNDING.REPUBLIC,
      allowed: autumn && !repeatBachelor,
      hint: !autumn
        ? "Доступно только для осеннего семестра"
        : repeatBachelor
          ? "Повторное участие бакалавра — только за свой счёт"
          : "Только осенний семестр",
    },
    {
      value: FUNDING.UNIVERSITY,
      allowed: grant && !repeatBachelor,
      hint: !grant
        ? "Только для студентов, обучающихся на гранте"
        : repeatBachelor
          ? "Повторное участие бакалавра — только за свой счёт"
          : "Для студентов, обучающихся на гранте",
    },
    {
      value: FUNDING.OWN,
      allowed: !grant || repeatBachelor,
      hint: "Для студентов платного отделения или бакалавров, участвующих повторно",
    },
  ];
}
