import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  padded?: boolean;
}

export function Card({ strong, padded = true, className, ...rest }: CardProps) {
  return <div className={cn(strong ? "glass-strong" : "glass", "reveal", padded && "p-4 sm:p-5", className)} {...rest} />;
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-lg font-semibold text-white sm:text-[22px]">{title}</h2>
      {action}
    </div>
  );
}
