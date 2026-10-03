import { Suspense, useLayoutEffect } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";

import { BottomNav } from "@/components/navigation/BottomNav";
import { SideNav } from "@/components/navigation/SideNav";
import { LoadingState } from "@/components/ui/States";
import { cn } from "@/lib/cn";

export function AppLayout() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const fullHeight = pathname.startsWith("/chat");

  useLayoutEffect(() => {
    if (navigationType !== "POP") window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, navigationType]);

  return (
    <div className="min-h-dvh">
      <SideNav />
      <main className="lg:pl-64">
        <div
          key={pathname}
          className={cn(
            "mx-auto w-full max-w-6xl animate-fade-in px-4 sm:px-6 lg:px-10",
            fullHeight ? "pt-4 lg:pt-8" : "pt-4 pb-28 lg:pt-8 lg:pb-12",
          )}
        >
          <Suspense fallback={<LoadingState className="min-h-[60dvh]" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
