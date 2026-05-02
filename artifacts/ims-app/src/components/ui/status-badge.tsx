import { cn } from "@/lib/utils";

type Status = "open" | "investigating" | "resolved";

const labels: Record<Status, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
        `status-${status}`,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {labels[status]}
    </span>
  );
}
