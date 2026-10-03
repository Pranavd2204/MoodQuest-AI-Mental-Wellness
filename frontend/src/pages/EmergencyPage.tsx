import { HeartHandshake, MapPin, MessagesSquare, Phone, PhoneCall, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { EmergencyContactsManager, telHref } from "@/components/EmergencyContactsManager";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { emergencyService } from "@/services/emergencyService";
import type { EmergencyResources } from "@/types";

const OFFLINE_FALLBACK: EmergencyResources = {
  emergency_number: "112",
  helplines: [{ name: "Tele-MANAS National Mental Health Helpline", number: "14416", availability: "Available 24/7" }],
  disclaimer:
    "MoodQuest is a wellness companion, not a medical or crisis service. If you or someone else is in danger, call your local emergency number now.",
};

type Sheet = "sos" | "family" | "counselor" | null;

function ActionButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-rose-300/20 bg-rose-950/30 font-medium text-white transition hover:border-rose-300/40 hover:bg-rose-900/30"
    >
      {icon}
      {label}
    </button>
  );
}

export function EmergencyPage() {
  const { status } = useAuth();
  const toast = useToast();
  const resources = useAsync(() => emergencyService.getResources(), []);
  const data = resources.data ?? OFFLINE_FALLBACK;
  const helpline = data.helplines[0];
  const [sheet, setSheet] = useState<Sheet>(null);
  const loggedIn = status === "authenticated";

  function findNearbyHelp() {
    const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
    const generic = "https://www.google.com/maps/search/mental+health+support+near+me";
    if (!navigator.geolocation) return open(generic);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        open(`https://www.google.com/maps/search/mental+health+support/@${coords.latitude},${coords.longitude},14z`),
      () => {
        toast.info("Location unavailable — showing general results instead.");
        open(generic);
      },
      { timeout: 8000 },
    );
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-10%,rgb(225_29_72/0.28),transparent_60%)]"
        aria-hidden
      />
      <PageHeader title="Need Immediate Help?" backTo={loggedIn ? undefined : "/welcome"} />

      <div className="mx-auto max-w-xl space-y-5">
        <div className="flex items-center gap-4 px-1">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-rose-500/50 blur-xl" aria-hidden />
            <HeartHandshake className="relative size-12 text-rose-300" aria-hidden />
          </div>
          <p className="text-lg leading-snug text-slate-100">
            You are not alone.
            <br />
            Help is always available.
          </p>
        </div>

        <button
          onClick={() => setSheet("sos")}
          className="flex w-full items-center gap-4 rounded-[var(--radius-card)] bg-gradient-to-r from-rose-600 via-red-500 to-rose-500 p-4 text-left text-white shadow-[0_12px_40px_-10px_rgb(244_63_94/0.9)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-rose-600 shadow-lg">
            <Phone className="size-7 fill-current" aria-hidden />
          </span>
          <span className="flex-1 text-center">
            <span className="block text-3xl font-extrabold tracking-wide">SOS</span>
            <span className="block text-sm text-rose-50">Call for Emergency · {data.emergency_number}</span>
          </span>
        </button>

        <div className="space-y-3">
          <ActionButton icon={<Users className="size-5" />} label="Contact Family" onClick={() => setSheet("family")} />
          <ActionButton icon={<MapPin className="size-5" />} label="Find Nearby Help" onClick={findNearbyHelp} />
          <ActionButton icon={<MessagesSquare className="size-5" />} label="Chat with Counselor" onClick={() => setSheet("counselor")} />
        </div>

        {helpline && (
          <a
            href={telHref(helpline.number)}
            className="flex items-center gap-4 rounded-[var(--radius-card)] border border-rose-400/30 bg-gradient-to-br from-rose-900/50 to-ink-850/80 p-4 transition hover:border-rose-300/50"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
              <PhoneCall className="size-6" aria-hidden />
            </span>
            <span>
              <span className="block text-xs text-rose-100/80">{helpline.name}</span>
              <span className="block text-2xl font-bold text-white tabular-nums">{helpline.number}</span>
              <span className="block text-xs text-rose-100/70">{helpline.availability}</span>
            </span>
          </a>
        )}

        <p className="px-1 text-center text-xs text-slate-400">{data.disclaimer}</p>
        {resources.error && (
          <p className="text-center text-[11px] text-slate-500">Showing saved default numbers because the server is unreachable.</p>
        )}
      </div>

      <Modal open={sheet === "sos"} onClose={() => setSheet(null)} title={`Call ${data.emergency_number}?`} description="This will open your phone's dialler to call emergency services.">
        <div className="flex flex-col gap-2">
          <a
            href={telHref(data.emergency_number)}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 font-semibold text-white"
          >
            <Phone className="size-5" aria-hidden /> Call {data.emergency_number} now
          </a>
          <Button variant="ghost" onClick={() => setSheet(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal open={sheet === "family"} onClose={() => setSheet(null)} title="Contact Family" description="Reach someone you trust.">
        {loggedIn ? (
          <EmergencyContactsManager callable />
        ) : (
          <p className="text-sm text-slate-300">
            <Link to="/login" className="font-semibold text-primary-300 hover:underline">
              Log in
            </Link>{" "}
            to save and call trusted contacts from here.
          </p>
        )}
      </Modal>

      <Modal open={sheet === "counselor"} onClose={() => setSheet(null)} title="Chat with a Counselor">
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Trained counselors are available
            by phone{helpline ? ` at ${helpline.name}` : ""}.
          </p>
          {helpline && (
            <a
              href={telHref(helpline.number)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 font-semibold text-white"
            >
              <PhoneCall className="size-5" aria-hidden /> Call {helpline.number}
            </a>
          )}
        </div>
      </Modal>
    </div>
  );
}
