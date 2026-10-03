import type { ReactNode } from "react";

import { TwilightScene } from "@/components/illustrations/TwilightScene";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8">
      <TwilightScene />
      <div className="relative z-10 w-full max-w-md animate-slide-up">{children}</div>
    </div>
  );
}
