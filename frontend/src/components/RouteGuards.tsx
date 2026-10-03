import { WifiOff } from "lucide-react";
import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { LotusMark } from "@/components/ui/Logo";
import { LoadingState } from "@/components/ui/States";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4" role="status" aria-label="Loading MoodQuest">
      <LotusMark className="size-16 animate-breathe" />
      <p className="text-sm text-slate-400">Loading your space…</p>
    </div>
  );
}

function Offline() {
  const { offlineMessage, retry, logout } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="size-10 text-slate-400" aria-hidden />
      <p className="max-w-sm text-slate-300">{offlineMessage}</p>
      <div className="flex gap-2">
        <Button onClick={retry}>Try again</Button>
        <Button variant="ghost" onClick={() => void logout()}>
          Log out
        </Button>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { status, loggedOut } = useAuth();
  const location = useLocation();
  if (status === "loading") return <Splash />;
  if (status === "offline") return <Offline />;
  if (status === "unauthenticated") {
    if (loggedOut || location.pathname === "/") return <Navigate to="/welcome" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <AppLayout />;
}

export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <Splash />;
  if (status === "authenticated") {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith("/") ? from : "/"} replace />;
  }
  return <Outlet />;
}

export function OpenRoute() {
  const { status } = useAuth();
  if (status === "loading") return <Splash />;
  if (status === "authenticated") return <AppLayout />;
  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pt-6 pb-12">
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
