import { ScanFace } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { HomeChatCard } from "@/components/chat/HomeChatCard";
import { MoodCards } from "@/components/mood/MoodCardsRow";
import { MoodSelector } from "@/components/mood/MoodSelector";
import { NotificationBell } from "@/components/NotificationBell";
import { QuickAccessGrid } from "@/components/QuickAccessGrid";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHeader } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { ErrorState } from "@/components/ui/States";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage } from "@/lib/api";
import { moodService } from "@/services/moodService";
import type { Mood } from "@/types";
import { firstName, greetingFor } from "@/utils/date";
import { MOOD_BY_KEY } from "@/utils/moods";

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const stats = useAsync(() => moodService.getMoodStats(7), []);
  const [saving, setSaving] = useState<Mood | null>(null);

  const selected = stats.data?.today_logged ? (stats.data.latest?.mood ?? null) : null;

  async function handleSelect(mood: Mood) {
    setSaving(mood);
    try {
      await moodService.logMood(mood);
      await stats.reload();
      toast.success(`Mood saved: ${MOOD_BY_KEY[mood].label}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't save your mood. Please try again."));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="lg:invisible">
          <Logo />
        </Link>
        <div className="flex items-center gap-2.5">
          <Link
            to="/emotion"
            aria-label="Emotion detection"
            title="Emotion detection"
            className="flex size-10 items-center justify-center rounded-full border border-accent-400/40 bg-accent-400/10 text-accent-400 shadow-[0_0_18px_rgb(45_212_191/0.3)] transition hover:scale-105 hover:bg-accent-400/20"
          >
            <ScanFace className="size-5" />
          </Link>
          <NotificationBell stats={stats.data} />
          <Link to="/profile" aria-label="Your profile">
            <Avatar name={user?.name ?? ""} src={user?.avatar_url} size="sm" />
          </Link>
        </div>
      </header>

      <section aria-labelledby="greeting" className="space-y-4">
        <div className="space-y-3">
          <h1 id="greeting" className="text-[28px] leading-9 font-semibold tracking-[-0.025em] text-white sm:text-[40px] sm:leading-[48px]">
            {greetingFor()}, {firstName(user?.name)} <span aria-hidden>👋</span>
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="text-base text-slate-300">How are you feeling today?</p>
            <Link
              to="/emotion"
              className="inline-flex items-center gap-2 rounded-full border border-primary-300/20 bg-primary-300/[0.08] px-3.5 py-1.5 font-label text-xs font-medium tracking-[0.04em] text-primary-200 transition hover:border-accent-400/50 hover:bg-primary-300/15 hover:text-white"
            >
              <ScanFace className="size-4 text-accent-400" aria-hidden />
              Detect with camera
            </Link>
          </div>
        </div>
        <MoodSelector selected={selected} saving={saving} onSelect={handleSelect} disabled={stats.loading && !stats.data} />
      </section>

      {stats.error && !stats.data ? (
        <div className="glass">
          <ErrorState message={stats.error} onRetry={stats.reload} />
        </div>
      ) : (
        <MoodCards stats={stats.data} loading={stats.loading && !stats.data} />
      )}

      <HomeChatCard />

      <section aria-label="Quick Access">
        <SectionHeader title="Sanctuary Hub" action={<span className="label-caps text-primary-300">Quick Access</span>} />
        <QuickAccessGrid />
      </section>
    </div>
  );
}
