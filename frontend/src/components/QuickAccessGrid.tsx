import { Clapperboard, Dumbbell, Flower2, Gamepad2, MessageSquare, Music, NotebookPen, Phone, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";

interface Tile {
  to: string;
  label: string;
  icon: LucideIcon;
  color: string;
  sos?: boolean;
}

const TILES: Tile[] = [
  { to: "/chat", label: "Chat AI", icon: MessageSquare, color: "#a5a6fb" },
  { to: "/music", label: "Music", icon: Music, color: "#2dd4bf" },
  { to: "/games", label: "Games", icon: Gamepad2, color: "#fde047" },
  { to: "/meditation", label: "Meditate", icon: Flower2, color: "#a78bfa" },
  { to: "/movies", label: "Movies", icon: Clapperboard, color: "#fb7185" },
  { to: "/meditation?tab=yoga", label: "Exercises", icon: Dumbbell, color: "#4ddcc6" },
  { to: "/journal", label: "Journal", icon: NotebookPen, color: "#c4cbff" },
  { to: "/emergency", label: "SOS", icon: Phone, color: "#f43f5e", sos: true },
];

export function QuickAccessGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {TILES.map(({ to, label, icon: Icon, color, sos }, index) => (
        <Link
          key={label}
          to={to}
          style={{ animationDelay: `${index * 30}ms` }}
          className={cn(
            "group flex aspect-[0.9] reveal flex-col items-center justify-center gap-2.5 rounded-[1.25rem] border p-2 text-center transition-all duration-200 hover:-translate-y-1 sm:aspect-[1.2] lg:aspect-[1.9]",
            sos
              ? "border-sos/50 bg-sos/[0.08] shadow-[0_0_24px_rgb(244_63_94/0.22)] hover:bg-sos/15"
              : "border-primary-300/10 bg-[rgb(22_28_45/0.6)] hover:border-primary-300/25 hover:bg-[rgb(34_43_69/0.75)]",
          )}
        >
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-110 sm:size-12",
              sos && "sos-ring",
            )}
            style={{ background: `${color}1f`, borderColor: `${color}4d`, color }}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <span className={cn("text-[12px] leading-tight font-medium sm:text-sm", sos ? "text-[#fb7185]" : "text-slate-200")}>
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
