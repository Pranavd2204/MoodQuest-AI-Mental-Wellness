import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { IconButton } from "@/components/ui/IconButton";

interface SearchToggleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchToggle({ open, onOpenChange, value, onChange, placeholder }: SearchToggleProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <IconButton label="Search" onClick={() => onOpenChange(true)}>
        <Search className="size-4.5" />
      </IconButton>
    );
  }
  return (
    <div className="relative w-44 animate-fade-in sm:w-64">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (onChange(""), onOpenChange(false))}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
        className="h-10 w-full rounded-full border border-white/10 bg-ink-850/80 pr-9 pl-9 text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary-400/60"
      />
      <button
        onClick={() => {
          onChange("");
          onOpenChange(false);
        }}
        aria-label="Close search"
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
