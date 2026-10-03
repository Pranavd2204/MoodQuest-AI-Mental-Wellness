import { LoaderCircle, RotateCcw, TriangleAlert, WifiOff, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { NETWORK_ERROR_MESSAGE } from "@/lib/api";
import { cn } from "@/lib/cn";

import { Button } from "./Button";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <LoaderCircle className="size-6 animate-spin text-primary-400" aria-hidden />
    </span>
  );
}

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-sm text-slate-400", className)}>
      <Spinner label={label} />
      <p>{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-2xl bg-white/[0.06]", className)} />;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, message, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex animate-fade-in flex-col items-center justify-center text-center",
        compact ? "gap-2 py-6" : "gap-3 py-10",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary-500/30 blur-xl" aria-hidden />
        <div className="relative flex size-14 items-center justify-center rounded-full border border-primary-400/30 bg-primary-500/15 text-primary-300">
          <Icon className="size-6" aria-hidden />
        </div>
      </div>
      <div className="max-w-xs space-y-1">
        <p className="font-semibold text-white">{title}</p>
        {message && <p className="text-sm text-slate-400">{message}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  const offline = message === NETWORK_ERROR_MESSAGE;
  const Icon = offline ? WifiOff : TriangleAlert;
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 py-10 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-300">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="max-w-sm text-sm text-slate-300">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={<RotateCcw className="size-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
