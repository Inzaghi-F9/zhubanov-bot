import { STAGES, stageOf } from "@/lib/statuses";

/** Визуальный прогресс заявки по этапам */
export function StatusTimeline({ status }: { status: string }) {
  const { index, state } = stageOf(status);

  return (
    <div className="flex flex-col">
      {STAGES.map((stage, i) => {
        const current = i === index;
        const done = i < index || (current && state === "done");
        const cls = done
          ? "bg-emerald-500 text-white"
          : current
            ? state === "failed"
              ? "bg-red-500 text-white"
              : state === "fix"
                ? "bg-amber-500 text-white"
                : "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-500";
        const icon = done ? "✓" : current ? (state === "failed" ? "✕" : state === "fix" ? "!" : "•") : i + 1;

        return (
          <div key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${cls}`}
              >
                {icon}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-0.5 min-h-6 flex-1 ${i < index ? "bg-emerald-300" : "bg-slate-200"}`} />
              )}
            </div>
            <div className={`pb-4 ${i <= index ? "" : "opacity-50"}`}>
              <div className="text-sm font-medium">{stage}</div>
              {current && <div className="text-xs text-slate-500">{status}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
