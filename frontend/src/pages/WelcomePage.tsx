import { ArrowRight, Gamepad2, Lock, Mail, MessageSquare, Sparkles, Wind, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { LotusBadge } from "@/components/ui/Logo";
import { AuthLayout } from "@/layouts/AuthLayout";

const FEATURES: { label: string; icon: LucideIcon; color: string }[] = [
  { label: "Chat", icon: MessageSquare, color: "text-accent-400" },
  { label: "Play", icon: Gamepad2, color: "text-primary-400" },
  { label: "Relax", icon: Wind, color: "text-accent-400" },
  { label: "Grow", icon: Sparkles, color: "text-astral-gold" },
];

export function WelcomePage() {
  return (
    <AuthLayout>
      <div className="flex min-h-[86dvh] flex-col items-center text-center">
        <div className="mt-4 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 animate-breathe rounded-full bg-primary-500/40 blur-2xl" aria-hidden />
            <LotusBadge className="relative size-24" iconClassName="size-11" />
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-[-0.03em] text-white sm:text-6xl">MoodQuest</h1>
          <p className="mt-3 text-base text-primary-300/90 sm:text-lg">Your AI Companion for a Happier You</p>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5" aria-label="What you can do">
          {FEATURES.map(({ label, icon: Icon, color }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full border border-primary-300/15 bg-[rgb(13_17_26/0.55)] px-4 py-2 font-label text-sm font-medium tracking-[0.04em] text-primary-200"
            >
              <Icon className={`size-4 ${color}`} aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="min-h-10 flex-1" />

        <div className="glass w-full space-y-5 p-6 sm:p-7">
          <Link
            to="/register"
            className="flex h-13 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 font-label text-[15px] font-semibold tracking-[0.04em] text-white shadow-[0_4px_20px_rgb(139_141_248/0.35)] transition hover:brightness-110 active:scale-[0.97]"
          >
            <Mail className="size-5" aria-hidden />
            Sign up with Email
          </Link>
          <div className="flex items-center gap-3 font-label text-xs tracking-[0.06em] text-slate-500">
            <span className="h-px flex-1 bg-primary-300/15" />
            or
            <span className="h-px flex-1 bg-primary-300/15" />
          </div>
          <p className="text-sm text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary-300 underline-offset-4 hover:text-primary-200 hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-10 flex items-center gap-2 font-label text-sm tracking-[0.04em] text-slate-300">
          <Lock className="size-4 text-accent-400" aria-hidden />
          A safe space. Anytime. Anywhere.
        </p>
        <Link
          to="/emergency"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-sos/50 bg-sos/[0.06] px-5 py-2 font-label text-sm font-medium tracking-[0.03em] text-[#fb7185] transition hover:bg-sos/15"
        >
          <span className="sos-ring size-2 rounded-full bg-sos" aria-hidden />
          Need help right now?
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </AuthLayout>
  );
}
