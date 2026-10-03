import { BookOpen, ChevronRight, Flame, LogOut, Phone, ScanFace, SmilePlus } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { EmergencyContactsManager } from "@/components/EmergencyContactsManager";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader } from "@/components/ui/Card";
import { SelectField, TextField } from "@/components/ui/Field";
import { ErrorState, InlineError, LoadingState } from "@/components/ui/States";
import { Toggle } from "@/components/ui/Toggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage } from "@/lib/api";
import { moodService } from "@/services/moodService";
import { userService } from "@/services/userService";
import type { NotificationPreferences, Profile } from "@/types";
import { formatDate } from "@/utils/date";
import { validateName, validatePassword } from "@/utils/validation";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
];

function timezones(current: string): string[] {
  let zones: string[] = [];
  try {
    zones = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    zones = [];
  }
  return zones.includes(current) ? zones : [current, ...zones];
}

function PersonalInfo({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const toast = useToast();
  const [name, setName] = useState(profile.user.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.user.avatar_url ?? "");
  const [language, setLanguage] = useState(profile.preferred_language);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const zones = useMemo(() => timezones(profile.timezone), [profile.timezone]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nameError = validateName(name);
    if (nameError) return setError(nameError);
    if (avatarUrl.trim() && !/^https?:\/\/.+/i.test(avatarUrl.trim())) return setError("Avatar must be an http(s) image URL");
    setSaving(true);
    setError(null);
    try {
      const updated = await userService.updateProfile({
        name: name.trim(),
        preferred_language: language,
        timezone,
        ...(avatarUrl.trim() ? { avatar_url: avatarUrl.trim() } : { remove_avatar: true }),
      });
      onSaved(updated);
      toast.success("Profile updated");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update your profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
      <TextField label="Email" value={profile.user.email} disabled hint="Email can't be changed yet." />
      <TextField
        label="Avatar image URL (optional)"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://…"
        type="url"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Timezone (used for streaks & charts)" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </SelectField>
      </div>
      <InlineError message={error} />
      <Button type="submit" loading={saving}>
        Save changes
      </Button>
    </form>
  );
}

function NotificationSettings({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const toast = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences>(profile.notification_preferences);
  const [saving, setSaving] = useState(false);

  async function update(next: NotificationPreferences) {
    const previous = prefs;
    setPrefs(next);
    setSaving(true);
    try {
      onSaved(await userService.updateProfile({ notification_preferences: next }));
    } catch (error) {
      setPrefs(previous);
      toast.error(getErrorMessage(error, "Couldn't save your preference."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="divide-y divide-white/5">
      <Toggle label="Daily check-in reminder" description="A gentle nudge to log your mood" checked={prefs.daily_reminder} disabled={saving} onChange={(v) => void update({ ...prefs, daily_reminder: v })} />
      <Toggle label="Weekly progress report" description="A summary of your week" checked={prefs.weekly_report} disabled={saving} onChange={(v) => void update({ ...prefs, weekly_report: v })} />
      <Toggle label="Game reminders" description="Suggestions to take a playful break" checked={prefs.game_reminders} disabled={saving} onChange={(v) => void update({ ...prefs, game_reminders: v })} />
      <p className="pt-3 text-xs text-slate-500">
        Preferences are saved to your account. Reminders show up in the notification bell.
      </p>
    </div>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!current) return setError("Enter your current password");
    const problem = validatePassword(next);
    if (problem) return setError(`New password: ${problem}`);
    setSaving(true);
    setError(null);
    try {
      await userService.changePassword(current, next);
      setCurrent("");
      setNext("");
      toast.success("Password updated");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't change your password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <TextField label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" hint="8+ characters with a letter and a number." />
      </div>
      <InlineError message={error} />
      <Button type="submit" variant="secondary" loading={saving}>
        Update password
      </Button>
    </form>
  );
}

export function ProfilePage() {
  const { setUser, logout } = useAuth();
  const profile = useAsync(() => userService.getProfile(), []);
  const stats = useAsync(() => moodService.getMoodStats(30), []);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (profile.data) setUser(profile.data.user);
  }, [profile.data, setUser]);

  const handleSaved = (updated: Profile) => profile.setData(updated);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  if (profile.loading && !profile.data) return <LoadingState label="Loading profile…" />;
  if (profile.error || !profile.data) return <ErrorState message={profile.error ?? "Profile unavailable"} onRetry={profile.reload} />;
  const data = profile.data;

  return (
    <div className="space-y-5">
      <PageHeader title="Profile & Settings" />

      <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar name={data.user.name} src={data.user.avatar_url} size="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold text-white">{data.user.name}</h2>
          <p className="truncate text-sm text-slate-400">{data.user.email}</p>
          <p className="mt-1 text-xs text-slate-500">Member since {formatDate(data.user.created_at)}</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-strong px-4 py-2 text-center">
            <p className="flex items-center justify-center gap-1 text-xl font-bold text-white">
              <Flame className="size-4 text-orange-400" aria-hidden /> {stats.data?.streak.current ?? "–"}
            </p>
            <p className="text-[11px] text-slate-400">day streak</p>
          </div>
          <div className="glass-strong px-4 py-2 text-center">
            <p className="flex items-center justify-center gap-1 text-xl font-bold text-white">
              <SmilePlus className="size-4 text-emerald-400" aria-hidden /> {stats.data?.total_checkins ?? "–"}
            </p>
            <p className="text-[11px] text-slate-400">check-ins (30d)</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Personal information" />
          <PersonalInfo key={data.user.name + data.timezone} profile={data} onSaved={handleSaved} />
        </Card>
        <div className="space-y-5">
          <Card>
            <SectionHeader title="Notifications" />
            <NotificationSettings profile={data} onSaved={handleSaved} />
          </Card>
          <Card padded={false} className="divide-y divide-white/5">
            {[
              { to: "/journal", label: "Journal", icon: BookOpen },
              { to: "/emotion", label: "Emotion Detection", icon: ScanFace },
              { to: "/emergency", label: "Emergency Help", icon: Phone },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 px-5 py-3.5 text-sm text-slate-200 transition hover:bg-white/[0.03]">
                <Icon className="size-4.5 text-primary-300" aria-hidden />
                <span className="flex-1">{label}</span>
                <ChevronRight className="size-4 text-slate-500" aria-hidden />
              </Link>
            ))}
          </Card>
        </div>
        <Card>
          <SectionHeader title="Trusted contacts" />
          <p className="mb-3 text-xs text-slate-400">People you can call from the Emergency page with one tap.</p>
          <EmergencyContactsManager />
        </Card>
        <Card>
          <SectionHeader title="Change password" />
          <ChangePassword />
        </Card>
      </div>

      <Button variant="outline" fullWidth icon={<LogOut className="size-4" />} onClick={() => void handleLogout()} loading={loggingOut} className="border-rose-400/30 text-rose-200 hover:bg-rose-500/10">
        Log out
      </Button>
    </div>
  );
}
