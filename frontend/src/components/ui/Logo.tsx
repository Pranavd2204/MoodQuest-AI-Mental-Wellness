import { useId } from "react";

import { cn } from "@/lib/cn";

export function LotusMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e1dfff" />
          <stop offset="0.55" stopColor="#a5a6fb" />
          <stop offset="1" stopColor="#4ddcc6" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <path d="M32 8c6 7 8 15 6 24-2 6-4 10-6 12-2-2-4-6-6-12-2-9 0-17 6-24z" />
        <path opacity=".85" d="M10 22c9 1 16 6 20 14 2 5 2 9 2 12-3 0-8-1-13-5-7-6-9-13-9-21z" />
        <path opacity=".85" d="M54 22c-9 1-16 6-20 14-2 5-2 9-2 12 3 0 8-1 13-5 7-6 9-13 9-21z" />
        <path opacity=".6" d="M4 38c8-2 16 0 22 6 2 2 4 5 6 7-6 2-13 1-19-3-4-3-7-6-9-10z" />
        <path opacity=".6" d="M60 38c-8-2-16 0-22 6-2 2-4 5-6 7 6 2 13 1 19-3 4-3 7-6 9-10z" />
      </g>
    </svg>
  );
}

export function LotusBadge({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-primary-300/15 bg-[rgb(22_28_45/0.7)] shadow-[0_0_24px_rgb(139_141_248/0.25)]",
        className,
      )}
    >
      <LotusMark className={cn("size-1/2", iconClassName)} />
    </span>
  );
}

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LotusBadge className={size === "lg" ? "size-11" : "size-9"} iconClassName="size-[58%]" />
      <span className={cn("font-display font-semibold tracking-tight text-primary-200", size === "lg" ? "text-xl" : "text-lg")}>
        MoodQuest
      </span>
    </span>
  );
}
