import { ALL_DOCUMENT_TYPES, type AppDocument, type Application, type EventInfo, type UniversityChoice } from "./types";

/** Выбранные вузы (до 3), с поддержкой старых заявок */
export function getUniversities(a: Application): UniversityChoice[] {
  if (Array.isArray(a.universities) && a.universities.length > 0) return a.universities;
  return a.university_name ? [{ name: a.university_name, country: a.country ?? "" }] : [];
}

export function universitiesText(a: Application): string {
  return getUniversities(a)
    .map((u, i) => `${i + 1}) ${u.name}${u.country ? ` (${u.country})` : ""}`)
    .join("; ");
}

/** Пакет документов, с поддержкой старых заявок (file_names/file_paths) */
export function getDocuments(a: Application): AppDocument[] {
  if (Array.isArray(a.documents) && a.documents.length > 0) return a.documents;
  return (a.file_paths ?? []).map((path, i) => ({
    type: `file_${i}`,
    label: "Документ",
    name: a.file_names?.[i] ?? path.split("/").pop() ?? "файл",
    path,
    comment: "",
  }));
}

export function docLabel(type: string, a?: Application): string {
  return (
    ALL_DOCUMENT_TYPES.find((d) => d.type === type)?.label ??
    a?.documents?.find((d) => d.type === type)?.label ??
    type
  );
}

export function eventText(info?: EventInfo | null): string {
  if (!info) return "";
  return `${info.date} ${info.time}, ${info.place}, язык: ${info.language}, формат: ${info.format}${
    info.note ? `, ${info.note}` : ""
  }`;
}

export function formatDate(d?: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString("ru-RU");
}
