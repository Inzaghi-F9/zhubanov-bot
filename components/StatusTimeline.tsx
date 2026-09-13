import { STATUS_FLOW, type DbStatus } from "@/lib/statuses";

/** Визуальный прогресс заявки по позитивному пути статусов */
export function StatusTimeline({ status }: { status: string }) {
  const idx = STATUS_FLOW.indexOf(status as DbStatus);
  const isRejected = idx < 0;
  // Отклонённая заявка «застряла» на стадии факультета
  const stopAt = isRejected ? 0 : idx;

  return (
    <div className="flex flex-col">
      {STATUS_FLOW.map((stage, i) => {
        const done = !isRejected && i < stopAt;
        const active = !isRejected && i === stopAt;
        const failed = isRejected && i === stopAt;
        return (
          <div key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-blue-600 text-white"
                      : failed
                        ? "bg-red-500 text-white"
                        : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : active ? "•" : failed ? "✕" : i + 1}
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div
                  className={`w-0.5 min-h-8 flex-1 ${
                    done ? "bg-emerald-300" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
            <div className={`pb-5 ${done || active || failed ? "" : "opacity-50"}`}>
              <div className="text-sm font-medium">{stage}</div>
              {active && <div className="text-xs text-slate-500">Текущая стадия</div>}
            </div>
          </div>
        );
      })}
      {isRejected && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          ✕ Заявка отклонена (статус: «{status}»). Исправьте причину и подайте повторно.
        </div>
      )}
    </div>
  );
}