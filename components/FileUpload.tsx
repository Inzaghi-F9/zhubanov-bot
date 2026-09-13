"use client";

import { useRef } from "react";
import { Paperclip, X, FileText } from "lucide-react";

export interface PickedFile {
  file: File;
  name: string;
}

const MAX_MB = 10;

/** Выбор файлов с индикацией и удалением; сами файлы грузятся в Storage при отправке */
export function FileUpload({
  files,
  setFiles,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  multiple = true,
}: {
  files: PickedFile[];
  setFiles: (files: PickedFile[]) => void;
  accept?: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const ok: PickedFile[] = [];
    for (const file of picked) {
      if (file.size > MAX_MB * 1024 * 1024) continue; // превышение размера — пропускаем
      ok.push({ file, name: file.name });
    }
    setFiles(multiple ? [...files, ...ok] : ok.slice(0, 1));
    e.target.value = "";
  };

  const remove = (idx: number) => setFiles(files.filter((_, i) => i !== idx));

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden onChange={handle} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="card inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm hover:border-blue-400 transition"
      >
        <Paperclip size={16} /> Прикрепить файлы
      </button>

      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700"
            >
              <FileText size={12} /> {f.name}
              <button type="button" onClick={() => remove(i)} aria-label="Удалить файл">
                <X size={12} className="hover:text-red-500" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-slate-400">PDF, JPG, PNG, DOC — до {MAX_MB} МБ каждый</p>
    </div>
  );
}