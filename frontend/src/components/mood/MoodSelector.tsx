import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import type { Mood } from "@/types";
import { MOODS } from "@/utils/moods";

import { MoodFace } from "./MoodFace";

interface MoodSelectorProps {
  selected: Mood | null;
  saving: Mood | null;
  onSelect: (mood: Mood) => void;
  disabled?: boolean;
}

export function MoodSelector({ selected, saving, onSelect, disabled }: MoodSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="How are you feeling today?"
      className="scrollbar-none -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 py-1 sm:mx-0 sm:grid sm:grid-cols-6 sm:overflow-visible sm:px-0"
    >
      {MOODS.map((mood) => {
        const active = selected === mood.key;
        const isSaving = saving === mood.key;
        return (
          <button
            key={mood.key}
            role="radio"
            aria-checked={active}
            disabled={disabled || saving !== null}
            onClick={() => onSelect(mood.key)}
            className={cn(
              "group flex w-[5.5rem] shrink-0 snap-start flex-col items-center gap-2.5 rounded-[1.25rem] border px-2 py-4 transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:hover:translate-y-0 sm:w-auto",
              active ? "bg-[rgb(34_43_69/0.78)]" : "border-primary-300/10 bg-[rgb(22_28_45/0.6)] hover:border-primary-300/25",
            )}
            style={active ? { borderColor: mood.color, boxShadow: `0 0 22px -4px ${mood.color}99, inset 0 0 0 1px ${mood.color}55` } : undefined}
          >
            <span
              className="flex size-12 items-center justify-center rounded-full border transition-all duration-300"
              style={{
                background: `radial-gradient(circle, ${mood.color}${active ? "40" : "1f"}, ${mood.color}0a 75%)`,
                borderColor: `${mood.color}${active ? "80" : "33"}`,
              }}
            >
              {isSaving ? (
                <LoaderCircle className="size-6 animate-spin" style={{ color: mood.color }} aria-hidden />
              ) : (
                <MoodFace mood={mood.key} className="size-8" />
              )}
            </span>
            <span className={cn("font-label text-xs font-medium tracking-[0.04em]", active ? "text-white" : "text-slate-400")}>
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
