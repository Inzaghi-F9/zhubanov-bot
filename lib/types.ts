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

export const CURRENT_SEMESTER = SEMESTERS[1]; // Весна 2027 (2 семестр)

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
  university_name: string;
  purpose: string;
  date_from: string;
  date_to: string;
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
