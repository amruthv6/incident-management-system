import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high" | "critical";

const labels: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
        `priority-${priority}`,
        className
      )}
    >
      {labels[priority]}
    </span>
  );
}
