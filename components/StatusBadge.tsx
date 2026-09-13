import { STATUS_BADGE_CLASS } from "@/lib/statuses";

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_BADGE_CLASS(status)} ${className}`}
    >
      {status}
    </span>
  );
}