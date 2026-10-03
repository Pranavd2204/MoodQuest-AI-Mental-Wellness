import { LogOut } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/cn";

import { EMOTION_NAV, EXPLORE_NAV, PRIMARY_NAV, type NavItem } from "./navItems";

function SideLink({ item, danger }: { item: NavItem; danger?: boolean }) {
  const { to, label, icon: Icon } = item;
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary-500/15 text-primary-200 shadow-[inset_0_0_0_1px_rgb(139_141_248/0.35),0_0_20px_-4px_rgb(139_141_248/0.45)]"
            : danger
              ? "text-sos hover:bg-sos/10"
              : "text-slate-400 hover:bg-primary-300/[0.06] hover:text-primary-200",
        )
      }
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </NavLink>
  );
}

export function SideNav() {
  const { user, logout } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-primary-300/10 bg-[rgb(13_17_26/0.72)] px-4 py-6 lg:flex">
      <Link to="/" className="mb-8 px-2">
        <Logo />
      </Link>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {[PRIMARY_NAV[0], EMOTION_NAV, ...PRIMARY_NAV.slice(1)].map((item) => (
          <SideLink key={item.to} item={item} />
        ))}
        <p className="label-caps mt-6 mb-2 px-4 text-slate-500">Explore</p>
        {EXPLORE_NAV.map((item) => (
          <SideLink key={item.to} item={item} danger={item.to === "/emergency"} />
        ))}
      </nav>
      {user && (
        <div className="glass mt-4 flex items-center gap-3 p-3">
          <Avatar name={user.name} src={user.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={() => void logout()}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
