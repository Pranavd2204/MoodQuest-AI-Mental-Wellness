import { cn } from "@/lib/cn";

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface PillTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

export function PillTabs<T extends string>({ options, value, onChange, label, size = "md", className }: PillTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn("scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "shrink-0 rounded-full font-label font-medium tracking-[0.04em] transition-all duration-200",
              size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
              active
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-[0_4px_20px_rgb(139_141_248/0.35)]"
                : "border border-primary-300/15 bg-primary-300/[0.06] text-slate-300 hover:border-primary-300/30 hover:text-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
