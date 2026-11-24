"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { getDocuments, getUniversities } from "@/lib/application";
import {
  DOCUMENT_TYPES,
  SOCIAL_DOCUMENT,
  LANGUAGES,
  EVENT_FORMATS,
  type Application,
  type EventInfo,
  type DecisionInfo,
  type InterviewEntry,
} from "@/lib/types";

const input =
  "card w-full rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition placeholder:text-slate-400";
const label = "block text-xs text-slate-500";

function Buttons({
  submitLabel,
  color = "bg-blue-600 hover:bg-blue-700",
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  color?: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex gap-2 pt-1">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onSubmit();
          } finally {
            setBusy(false);
          }
        }}
        className={`flex-1 rounded-xl py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 ${color}`}
      >
        {busy ? "⏳ Отправляем…" : submitLabel}
      </button>
      <button
        onClick={onCancel}
        className="flex-1 rounded-xl bg-slate-200 py-2.5 text-xs text-slate-600 transition hover:bg-slate-300"
      >
        Отмена
      </button>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-[color:var(--border)] bg-slate-50/50 p-3">
      <div className="text-xs font-bold">{title}</div>
      {children}
    </div>
  );
}

/** Причина (не рекомендовать / отклонить) */
export function ReasonForm({
  title,
  placeholder,
  submitLabel,
  color = "bg-red-500 hover:bg-red-600",
  onSubmit,
  onCancel,
}: {
  title: string;
  placeholder: string;
  submitLabel: string;
  color?: string;
  onSubmit: (text: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <Panel title={title}>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className={`${input} resize-none`} />
      <Buttons
        submitLabel={submitLabel}
        color={color}
        onCancel={onCancel}
        onSubmit={async () => {
          if (!text.trim()) return void toast.error("Укажите причину");
          await onSubmit(text.trim());
        }}
      />
    </Panel>
  );
}

/** Рекомендация факультета с дедлайном */
export function RecommendForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (deadline: string, comment: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [deadline, setDeadline] = useState("");
  const [comment, setComment] = useState("");
  return (
    <Panel title="✓ Рекомендовать студента в департамент">
      <label className={label}>
        Дедлайн (необязательно)
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className={label}>
        Комментарий (необязательно)
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: документы в порядке" className={`${input} mt-1`} />
      </label>
      <Buttons submitLabel="Рекомендовать" color="bg-emerald-500 hover:bg-emerald-600" onCancel={onCancel} onSubmit={() => onSubmit(deadline, comment.trim())} />
    </Panel>
  );
}

/** Возврат пакета документов на исправление с замечаниями по каждому документу */
export function FixForm({
  app,
  title,
  onSubmit,
  onCancel,
}: {
  app: Application;
  title: string;
  onSubmit: (feedback: Record<string, string>, comment: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const docs = getDocuments(app);
  const types = [...DOCUMENT_TYPES, ...((app.social_status ?? []).length ? [SOCIAL_DOCUMENT] : [])];
  const extra = docs.filter((d) => !types.some((t) => t.type === d.type));
  const rows = [
    ...types.map((t) => ({ type: t.type, label: t.label, doc: docs.find((d) => d.type === t.type) })),
    ...extra.map((d) => ({ type: d.type, label: d.label, doc: d })),
  ];
  const [fb, setFb] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");

  return (
    <Panel title={title}>
      <div className="text-[11px] text-slate-500">Напишите замечание напротив документов, которые нужно исправить:</div>
      {rows.map((r) => (
        <div key={r.type} className="grid gap-1 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="text-xs">
            {r.label}
            <span className="ml-1 text-slate-400">{r.doc?.path ? "📎" : r.doc?.comment ? "💬" : "— нет"}</span>
          </div>
          <input
            value={fb[r.type] ?? ""}
            onChange={(e) => setFb({ ...fb, [r.type]: e.target.value })}
            placeholder="Замечание (оставьте пустым, если всё верно)"
            className={input}
          />
        </div>
      ))}
      <label className={label}>
        Общий комментарий
        <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className={`${input} mt-1 resize-none`} />
      </label>
      <Buttons
        submitLabel="Отправить на исправление"
        color="bg-amber-500 hover:bg-amber-600"
        onCancel={onCancel}
        onSubmit={async () => {
          const clean = Object.fromEntries(Object.entries(fb).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
          if (!comment.trim() && Object.keys(clean).length === 0) {
            return void toast.error("Укажите, что нужно исправить");
          }
          await onSubmit(clean, comment.trim());
        }}
      />
    </Panel>
  );
}

/** Приглашение на тестирование / интервью */
export function EventForm({
  kind,
  initial,
  onSubmit,
  onCancel,
}: {
  kind: "test" | "interview";
  initial?: EventInfo | null;
  onSubmit: (info: EventInfo) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [info, setInfo] = useState<EventInfo>(
    initial ?? { date: "", time: "", place: "", language: "", format: EVENT_FORMATS[0], note: "" }
  );
  const langs = info.language ? info.language.split(", ") : [];
  const toggleLang = (l: string) => {
    const next = langs.includes(l) ? langs.filter((x) => x !== l) : [...langs, l];
    setInfo({ ...info, language: LANGUAGES.filter((x) => next.includes(x)).join(", ") });
  };

  return (
    <Panel title={kind === "test" ? "📝 Приглашение на тестирование" : "🎤 Приглашение на интервью"}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={label}>
          Дата *
          <input type="date" value={info.date} onChange={(e) => setInfo({ ...info, date: e.target.value })} className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Время *
          <input type="time" value={info.time} onChange={(e) => setInfo({ ...info, time: e.target.value })} className={`${input} mt-1`} />
        </label>
      </div>
      <label className={label}>
        Место / ссылка *
        <input
          value={info.place}
          onChange={(e) => setInfo({ ...info, place: e.target.value })}
          placeholder="Главный корпус, каб. 205 или ссылка Zoom"
          className={`${input} mt-1`}
        />
      </label>
      <div className={label}>
        Язык *
        <div className="mt-1 flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <label key={l} className={`card cursor-pointer rounded-lg px-3 py-1.5 text-xs ${langs.includes(l) ? "border-blue-500 text-blue-700" : ""}`}>
              <input type="checkbox" className="mr-1" checked={langs.includes(l)} onChange={() => toggleLang(l)} />
              {l}
            </label>
          ))}
        </div>
      </div>
      <label className={label}>
        Формат *
        <select value={info.format} onChange={(e) => setInfo({ ...info, format: e.target.value })} className={`${input} mt-1`}>
          {EVENT_FORMATS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      <label className={label}>
        Дополнительно
        <input
          value={info.note ?? ""}
          onChange={(e) => setInfo({ ...info, note: e.target.value })}
          placeholder="Что взять с собой, длительность и т.п."
          className={`${input} mt-1`}
        />
      </label>
      <Buttons
        submitLabel="Отправить приглашение студенту"
        onCancel={onCancel}
        onSubmit={async () => {
          if (!info.date || !info.time || !info.place.trim() || !info.language) {
            return void toast.error("Заполните дату, время, место и язык");
          }
          await onSubmit({ ...info, place: info.place.trim(), note: info.note?.trim() });
        }}
      />
    </Panel>
  );
}

/** Результат теста / интервью: прошёл / не прошёл */
export function ResultForm({
  title,
  onSubmit,
  onCancel,
}: {
  title: string;
  onSubmit: (passed: boolean, comment: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [passed, setPassed] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  return (
    <Panel title={title}>
      <div className="flex gap-2">
        <label className={`card flex-1 cursor-pointer rounded-xl p-3 text-center text-sm font-semibold ${passed === true ? "border-emerald-500 bg-emerald-50 text-emerald-700" : ""}`}>
          <input type="radio" className="mr-2" checked={passed === true} onChange={() => setPassed(true)} />✓ Прошёл
        </label>
        <label className={`card flex-1 cursor-pointer rounded-xl p-3 text-center text-sm font-semibold ${passed === false ? "border-red-500 bg-red-50 text-red-700" : ""}`}>
          <input type="radio" className="mr-2" checked={passed === false} onChange={() => setPassed(false)} />✕ Не прошёл
        </label>
      </div>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий / баллы (необязательно)" className={input} />
      <Buttons
        submitLabel="Сохранить и уведомить студента"
        onCancel={onCancel}
        onSubmit={async () => {
          if (passed === null) return void toast.error("Отметьте результат");
          await onSubmit(passed, comment.trim());
        }}
      />
    </Panel>
  );
}

/** Итоговое решение департамента */
export function DecisionForm({
  app,
  onSubmit,
  onCancel,
}: {
  app: Application;
  onSubmit: (info: DecisionInfo) => void | Promise<void>;
  onCancel: () => void;
}) {
  const unis = getUniversities(app);
  const [info, setInfo] = useState<DecisionInfo>(
    app.decision_info ?? { decision: "Принято", university: unis[0]?.name ?? "", country: unis[0]?.country ?? "", comment: "" }
  );
  const accepted = info.decision === "Принято";

  return (
    <Panel title="🏁 Итоговое решение">
      <div className="flex gap-2">
        {["Принято", "Не принято"].map((d) => (
          <label
            key={d}
            className={`card flex-1 cursor-pointer rounded-xl p-3 text-center text-sm font-semibold ${
              info.decision === d ? (d === "Принято" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700") : ""
            }`}
          >
            <input type="radio" className="mr-2" checked={info.decision === d} onChange={() => setInfo({ ...info, decision: d })} />
            {d}
          </label>
        ))}
      </div>
      {accepted && (
        <>
          {unis.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {unis.map((u) => (
                <button
                  key={u.name}
                  type="button"
                  onClick={() => setInfo({ ...info, university: u.name, country: u.country })}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] ${info.university === u.name ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200"}`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={label}>
              Куда прошёл (вуз) *
              <input value={info.university} onChange={(e) => setInfo({ ...info, university: e.target.value })} className={`${input} mt-1`} />
            </label>
            <label className={label}>
              Страна *
              <input value={info.country} onChange={(e) => setInfo({ ...info, country: e.target.value })} className={`${input} mt-1`} />
            </label>
          </div>
        </>
      )}
      <textarea
        rows={2}
        value={info.comment}
        onChange={(e) => setInfo({ ...info, comment: e.target.value })}
        placeholder="Комментарий для студента (сроки, дальнейшие шаги, причина)"
        className={`${input} resize-none`}
      />
      <Buttons
        submitLabel="Отправить решение студенту"
        color={accepted ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}
        onCancel={onCancel}
        onSubmit={async () => {
          if (accepted && (!info.university.trim() || !info.country.trim())) {
            return void toast.error("Укажите вуз и страну");
          }
          await onSubmit(accepted ? info : { ...info, university: "", country: "" });
        }}
      />
    </Panel>
  );
}

/** Приглашение на интервью по конкретному выбранному вузу и языку (можно назначать несколько разным вузам) */
export function InterviewInviteForm({
  app,
  onSubmit,
  onCancel,
}: {
  app: Application;
  onSubmit: (entry: InterviewEntry) => void | Promise<void>;
  onCancel: () => void;
}) {
  const unis = getUniversities(app);
  const existing = app.interviews ?? [];
  const [uniIdx, setUniIdx] = useState(0);
  const selectedUni = unis[uniIdx] ?? { name: app.university_name, country: app.country ?? "" };

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [customLang, setCustomLang] = useState("");
  const [format, setFormat] = useState<string>(EVENT_FORMATS[0]);
  const [note, setNote] = useState("");

  const toggleLang = (l: string) => {
    setSelectedLangs((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  return (
    <Panel title="🎤 Назначить интервью для выбранного вуза / языка">
      {existing.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-2 text-[11px] text-blue-800">
          <div className="font-semibold">Уже назначенные интервью ({existing.length}):</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {existing.map((iv) => (
              <li key={iv.id}>
                <b>{iv.university}</b> — {iv.date} {iv.time}, {iv.language}
                {iv.result ? ` (${iv.result})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {unis.length > 0 && (
        <label className={label}>
          Выберите вуз (из списка студента) *
          <select
            value={uniIdx}
            onChange={(e) => setUniIdx(Number(e.target.value))}
            className={`${input} mt-1`}
          >
            {unis.map((u, i) => (
              <option key={i} value={i}>
                {i + 1}) {u.name} {u.country ? `(${u.country})` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className={label}>
          Дата *
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Время *
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${input} mt-1`} />
        </label>
      </div>

      <label className={label}>
        Место / ссылка *
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Главный корпус, каб. 205 или ссылка Zoom / Meet"
          className={`${input} mt-1`}
        />
      </label>

      <div className={label}>
        Язык интервью *
        <div className="mt-1 flex flex-wrap gap-1.5">
          {LANGUAGES.map((l) => (
            <label
              key={l}
              className={`card cursor-pointer rounded-lg px-2.5 py-1 text-xs ${
                selectedLangs.includes(l) ? "border-blue-500 text-blue-700" : ""
              }`}
            >
              <input
                type="checkbox"
                className="mr-1"
                checked={selectedLangs.includes(l)}
                onChange={() => toggleLang(l)}
              />
              {l}
            </label>
          ))}
        </div>
        <input
          value={customLang}
          onChange={(e) => setCustomLang(e.target.value)}
          placeholder="Или другой язык (например: Итальянский, Немецкий)"
          className={`${input} mt-1.5`}
        />
      </div>

      <label className={label}>
        Формат *
        <select value={format} onChange={(e) => setFormat(e.target.value)} className={`${input} mt-1`}>
          {EVENT_FORMATS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>

      <label className={label}>
        Дополнительно
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Комиссия, документы с собой и т.п."
          className={`${input} mt-1`}
        />
      </label>

      <Buttons
        submitLabel="Назначить интервью и уведомить студента"
        color="bg-teal-600 hover:bg-teal-700"
        onCancel={onCancel}
        onSubmit={async () => {
          const langStr = [
            ...LANGUAGES.filter((l) => selectedLangs.includes(l)),
            ...(customLang.trim() ? [customLang.trim()] : []),
          ].join(", ");

          if (!date || !time || !place.trim() || !langStr) {
            return void toast.error("Заполните дату, время, место и язык интервью");
          }

          await onSubmit({
            id: crypto.randomUUID(),
            university: selectedUni.name,
            country: selectedUni.country,
            date,
            time,
            place: place.trim(),
            language: langStr,
            format,
            note: note.trim(),
            result: null,
            result_comment: "",
          });
        }}
      />
    </Panel>
  );
}

/** Оценка каждого назначенного интервью (Прошёл / Не прошёл по каждому вузу) */
export function InterviewsResultForm({
  app,
  onSubmit,
  onCancel,
}: {
  app: Application;
  onSubmit: (updated: InterviewEntry[], summary: string, allFailed: boolean, anyPassed: boolean) => void | Promise<void>;
  onCancel: () => void;
}) {
  const initial = app.interviews ?? [];
  const [items, setItems] = useState<InterviewEntry[]>(initial);

  const setResult = (id: string, result: "Прошёл" | "Не прошёл") => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, result } : it)));
  };

  const setComment = (id: string, result_comment: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, result_comment } : it)));
  };

  return (
    <Panel title="☑️ Итоги интервью по каждому вузу (Прошёл / Не прошёл)">
      <div className="space-y-2.5">
        {items.map((iv, i) => (
          <div key={iv.id} className="card space-y-2 rounded-xl p-3">
            <div className="text-xs font-semibold">
              {i + 1}) {iv.university} {iv.country ? `(${iv.country})` : ""} · 🗣 {iv.language} · 📅{" "}
              {iv.date} {iv.time}
            </div>
            <div className="flex gap-2">
              <label
                className={`card flex-1 cursor-pointer rounded-lg p-2 text-center text-xs font-semibold ${
                  iv.result === "Прошёл" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : ""
                }`}
              >
                <input
                  type="radio"
                  className="mr-1.5"
                  checked={iv.result === "Прошёл"}
                  onChange={() => setResult(iv.id, "Прошёл")}
                />
                ✓ Прошёл
              </label>
              <label
                className={`card flex-1 cursor-pointer rounded-lg p-2 text-center text-xs font-semibold ${
                  iv.result === "Не прошёл" ? "border-red-500 bg-red-50 text-red-700" : ""
                }`}
              >
                <input
                  type="radio"
                  className="mr-1.5"
                  checked={iv.result === "Не прошёл"}
                  onChange={() => setResult(iv.id, "Не прошёл")}
                />
                ✕ Не прошёл
              </label>
            </div>
            <input
              value={iv.result_comment ?? ""}
              onChange={(e) => setComment(iv.id, e.target.value)}
              placeholder="Комментарий по этому интервью (необязательно)"
              className={input}
            />
          </div>
        ))}
      </div>

      <Buttons
        submitLabel="Сохранить итоги и уведомить студента"
        onCancel={onCancel}
        onSubmit={async () => {
          const decided = items.filter((it) => it.result);
          if (decided.length === 0) {
            return void toast.error("Отметьте результат хотя бы для одного интервью");
          }
          const anyPassed = decided.some((it) => it.result === "Прошёл");
          const allDecided = decided.length === items.length;
          const allFailed = allDecided && !anyPassed;
          const summary = items
            .map((it) => `${it.university}: ${it.result ?? "ожидается"}`)
            .join("; ");
          await onSubmit(items, summary, allFailed, anyPassed);
        }}
      />
    </Panel>
  );
}
