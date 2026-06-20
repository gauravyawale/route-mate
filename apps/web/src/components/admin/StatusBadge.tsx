import { cn } from "@/lib/utils";

type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "confirmed"
  | "cancelled"
  | "open"
  | "in_progress"
  | "completed"
  | "no_seat"
  | "no_show";

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  approved: {
    label: "Approved",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  },
  paid: {
    label: "Paid",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  },
  open: {
    label: "Open",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  no_seat: {
    label: "No Seat",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  no_show: {
    label: "No Show",
    className:
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400",
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-zinc-100 text-zinc-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
