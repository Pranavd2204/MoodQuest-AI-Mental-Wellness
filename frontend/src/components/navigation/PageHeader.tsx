import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  showBack?: boolean;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, backTo, showBack = true, className }: PageHeaderProps) {
  const navigate = useNavigate();
  const goBack = () => {
    if (backTo) navigate(backTo);
    else if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/");
  };

  return (
    <header className={cn("mb-5 flex items-center gap-3 pt-1", className)}>
      {showBack && (
        <button
          onClick={goBack}
          aria-label="Go back"
          className="-ml-1.5 rounded-full p-1.5 text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="size-5.5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
        {subtitle && <div className="truncate text-xs text-slate-400 sm:text-sm">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
