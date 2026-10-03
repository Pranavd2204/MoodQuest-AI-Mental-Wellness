import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-[0_4px_20px_rgb(139_141_248/0.35)] hover:brightness-110 hover:shadow-[0_6px_26px_rgb(139_141_248/0.5)]",
  secondary: "border border-primary-300/20 bg-primary-300/[0.08] text-primary-200 hover:bg-primary-300/15",
  ghost: "text-slate-300 hover:bg-primary-300/[0.08] hover:text-white",
  danger: "bg-sos text-white shadow-[0_0_24px_rgb(244_63_94/0.35)] hover:brightness-110",
  outline: "border border-primary-300/20 bg-transparent text-primary-200 hover:border-primary-300/40 hover:bg-primary-300/[0.08]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-11 px-5 text-[13px] gap-2",
  lg: "h-13 px-6 text-sm gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, fullWidth, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full font-label font-semibold tracking-[0.04em] transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});
