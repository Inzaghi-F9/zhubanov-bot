export type Role = "student" | "faculty" | "admin";

export interface Profile {
  id: string;
  email: string;
  role: Role;
  name: string;
  group_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
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