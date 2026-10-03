import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";

import { PRIMARY_NAV } from "./navItems";

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-full border border-primary-300/12 bg-[rgb(22_28_45/0.72)] px-2 py-1.5 shadow-[0_12px_32px_-4px_rgb(7_9_14/0.75),0_0_24px_rgb(139_141_248/0.12)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 rounded-full py-2 font-label text-[11px] font-medium tracking-[0.04em] transition-all duration-200",
                  isActive
                    ? "bg-primary-500/15 text-primary-200 shadow-[inset_0_0_0_1px_rgb(139_141_248/0.35),0_0_18px_rgb(139_141_248/0.3)]"
                    : "text-slate-400 hover:text-primary-200",
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
