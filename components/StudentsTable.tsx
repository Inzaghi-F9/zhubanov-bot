"use client";

import { getUniversities, formatDate } from "@/lib/application";
import { StatusBadge } from "./StatusBadge";
import type { Application } from "@/lib/types";

/** Полный список студентов в виде таблицы */
export function StudentsTable({
  apps,
  onSelect,
}: {
  apps: Application[];
  onSelect?: (app: Application) => void;
}) {
  if (apps.length === 0) {
    return <div className="card rounded-2xl p-10 text-center text-sm text-slate-500">Нет студентов 🎓</div>;
  }

  const th = "whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
  const td = "px-3 py-2 align-top text-xs";

  return (
    <div className="card overflow-x-auto rounded-2xl shadow-sm">
      <table className="min-w-[1400px] w-full border-collapse">
        <thead className="border-b border-[color:var(--border)] bg-slate-50">
          <tr>
            <th className={th}>№</th>
            <th className={th}>ФИО</th>
            <th className={th}>Факультет</th>
            <th className={th}>Курс / группа</th>
            <th className={th}>Специальность</th>
            <th className={th}>Уровень</th>
            <th className={th}>Форма</th>
            <th className={th}>Финансирование</th>
            <th className={th}>GPA</th>
            <th className={th}>Участие</th>
            <th className={th}>Выбранные вузы</th>
            <th className={th}>Соц. положение</th>
            <th className={th}>Контакты</th>
            <th className={th}>Статус</th>
            <th className={th}>Подана</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((a, i) => (
            <tr
              key={a.id}
              onClick={() => onSelect?.(a)}
              className={`border-b border-[color:var(--border)] last:border-0 ${onSelect ? "cursor-pointer hover:bg-blue-50/50" : ""}`}
            >
              <td className={td}>{i + 1}</td>
              <td className={`${td} font-semibold`}>
                {a.student_name}
                {a.birth_date && <div className="font-normal text-slate-400">{formatDate(a.birth_date)}</div>}
              </td>
              <td className={td}>{a.student_faculty}</td>
              <td className={td}>
                {a.course ? `${a.course} курс` : ""}
                {a.student_group && <div className="text-slate-400">{a.student_group}</div>}
              </td>
              <td className={td}>{a.specialty}</td>
              <td className={td}>{a.education_level}</td>
              <td className={td}>{a.study_form}</td>
              <td className={td}>{a.funding_source}</td>
              <td className={td}>{a.student_gpa}</td>
              <td className={td}>{a.participation}</td>
              <td className={td}>
                <ol className="list-decimal pl-4">
                  {getUniversities(a).map((u, j) => (
                    <li key={j}>
                      {u.name}
                      {u.country && <span className="text-slate-400"> ({u.country})</span>}
                    </li>
                  ))}
                </ol>
              </td>
              <td className={td}>{(a.social_status ?? []).join(", ") || "—"}</td>
              <td className={td}>
                {a.student_email}
                {a.student_phone && <div className="text-slate-400">{a.student_phone}</div>}
              </td>
              <td className={td}>
                <StatusBadge status={a.status} />
              </td>
              <td className={td}>{formatDate(a.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
