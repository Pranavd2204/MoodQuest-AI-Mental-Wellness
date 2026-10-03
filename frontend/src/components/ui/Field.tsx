import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-2xl border bg-[rgb(7_9_14/0.6)] px-4 text-sm text-white shadow-[inset_0_2px_6px_rgb(0_0_0/0.35)] placeholder:text-primary-300/40 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 disabled:opacity-60";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  icon?: ReactNode;
  trailing?: ReactNode;
  hint?: string;
  hideLabel?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, icon, trailing, hint, hideLabel, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className={cn("block text-xs font-medium text-slate-300", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            CONTROL,
            "h-12",
            icon ? "pl-10" : undefined,
            trailing ? "pr-11" : undefined,
            error ? "border-rose-400/60" : "border-primary-300/15",
          )}
          {...rest}
        />
        {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
      </div>
      {(error || hint) && (
        <p id={messageId} className={cn("text-xs", error ? "text-rose-300" : "text-slate-500")}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        className={cn(CONTROL, "min-h-40 resize-y py-3 leading-relaxed", error ? "border-rose-400/60" : "border-primary-300/15")}
        {...rest}
      />
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
});

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
}

export function SelectField({ label, hideLabel, className, id, children, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className={cn("block text-xs font-medium text-slate-300", hideLabel && "sr-only")}>
        {label}
      </label>
      <select id={inputId} className={cn(CONTROL, "h-11 appearance-none border-white/10 pr-10")} {...rest}>
        {children}
      </select>
    </div>
  );
}
