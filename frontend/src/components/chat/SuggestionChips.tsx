import { BookOpen, Clapperboard, Gamepad2, Headphones, LifeBuoy, MessageCircle, Moon, Wind, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/cn";

const SUGGESTION_ROUTES: Record<string, string> = {
  "Open emergency help": "/emergency",
  "Try a breathing exercise": "/meditation?tab=breathing",
  "Start box breathing": "/meditation?tab=breathing",
  "Sleep meditation": "/meditation?tab=mindfulness",
  "Play calming music": "/music",
  "Play Lo-Fi Chill": "/music",
  "Play calm piano": "/music",
  "Play Stress Burst": "/games",
  "Play a relaxing game": "/games",
  "Play a fun game": "/games",
  "Play a focus game": "/games",
  "Write in my journal": "/journal",
  "Suggest a comfort movie": "/movies",
};

function chipIcon(text: string): { icon: LucideIcon; color: string } {
  const route = SUGGESTION_ROUTES[text] ?? "";
  if (route.startsWith("/emergency")) return { icon: LifeBuoy, color: "text-[#fb7185]" };
  if (route.includes("mindfulness")) return { icon: Moon, color: "text-primary-300" };
  if (route.startsWith("/meditation")) return { icon: Wind, color: "text-accent-400" };
  if (route.startsWith("/music")) return { icon: Headphones, color: "text-primary-300" };
  if (route.startsWith("/games")) return { icon: Gamepad2, color: "text-astral-gold" };
  if (route.startsWith("/journal")) return { icon: BookOpen, color: "text-primary-300" };
  if (route.startsWith("/movies")) return { icon: Clapperboard, color: "text-[#fb7185]" };
  return { icon: MessageCircle, color: "text-primary-300" };
}

interface SuggestionChipsProps {
  suggestions: string[];
  onSend: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SuggestionChips({ suggestions, onSend, disabled, className }: SuggestionChipsProps) {
  const navigate = useNavigate();
  if (!suggestions.length) return null;
  return (
    <div className={cn("scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1", className)} aria-label="Suggested prompts">
      {suggestions.map((text) => {
        const { icon: Icon, color } = chipIcon(text);
        return (
        <button
          key={text}
          type="button"
          onClick={() => {
            const route = SUGGESTION_ROUTES[text];
            if (route) navigate(route);
            else onSend(text);
          }}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary-300/15 bg-[rgb(22_28_45/0.6)] px-4 py-2 font-label text-[13px] font-medium tracking-[0.03em] text-primary-200 transition hover:border-accent-400/40 hover:bg-[rgb(34_43_69/0.75)] disabled:opacity-50"
        >
          <Icon className={`size-4 ${color}`} aria-hidden />
          {text}
        </button>
        );
      })}
    </div>
  );
}
