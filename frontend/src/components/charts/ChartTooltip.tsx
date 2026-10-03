import type { ReactNode } from "react";

export function TooltipCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass-strong min-w-36 px-3 py-2 text-xs shadow-2xl">
      <p className="mb-1 font-semibold text-white">{title}</p>
      <div className="space-y-0.5 text-slate-300">{children}</div>
    </div>
  );
}

export function TooltipRow({ color, label, value }: { color?: string; label: string; value: ReactNode }) {
  return (
    <p className="flex items-center gap-2">
      {color && <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />}
      <span className="flex-1">{label}</span>
      <span className="font-semibold text-white tabular-nums">{value}</span>
    </p>
  );
}
