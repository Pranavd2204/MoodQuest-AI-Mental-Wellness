import { ExternalLink, Play } from "lucide-react";

import { cn } from "@/lib/cn";
import type { Recommendation } from "@/types";

import { Artwork } from "./Artwork";

function openExternal(url: string | null) {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export function FeaturedCard({
  item,
  ctaLabel,
  tall,
}: {
  item: Recommendation;
  ctaLabel?: string;
  tall?: boolean;
}) {
  return (
    <Artwork
      seed={item.title}
      kind={item.type}
      imageUrl={item.image_url}
      className={cn("glass animate-pop rounded-[var(--radius-card)]", tall ? "aspect-[4/3] sm:aspect-[21/9]" : "aspect-[16/9] sm:aspect-[21/8]")}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
        <div className="min-w-0">
          <h3 className="text-2xl font-bold text-white drop-shadow sm:text-3xl">{item.title}</h3>
          {item.subtitle && <p className="text-sm text-slate-200">{item.subtitle}</p>}
          {item.description && item.type === "movie" && (
            <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-300 sm:text-sm">{item.description}</p>
          )}
          {ctaLabel && (
            <button
              onClick={() => openExternal(item.external_url)}
              disabled={!item.external_url}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <Play className="size-3.5 fill-current" aria-hidden />
              {ctaLabel}
            </button>
          )}
        </div>
        {!ctaLabel && (
          <button
            onClick={() => openExternal(item.external_url)}
            disabled={!item.external_url}
            aria-label={`Play ${item.title}`}
            className="flex size-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-[0_0_30px_-4px_rgb(139_141_248/0.9)] transition hover:scale-105"
          >
            <Play className="ml-0.5 size-5 fill-current" aria-hidden />
          </button>
        )}
      </div>
    </Artwork>
  );
}

export function MediaCard({ item, portrait }: { item: Recommendation; portrait?: boolean }) {
  return (
    <button
      onClick={() => openExternal(item.external_url)}
      disabled={!item.external_url}
      className="group w-full reveal text-left"
      title={item.external_url ? `Open ${item.title}` : item.title}
    >
      <Artwork
        seed={item.title}
        kind={item.type}
        imageUrl={item.image_url}
        className={cn(
          "rounded-2xl border border-white/[0.07] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_30px_-10px_rgb(139_141_248/0.6)]",
          portrait ? "aspect-[3/4]" : "aspect-square",
        )}
      >
        {portrait && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-transparent to-transparent" />
            <p className="absolute inset-x-0 bottom-0 p-2.5 text-sm leading-tight font-semibold text-white">{item.title}</p>
          </>
        )}
        <span className="absolute top-2 right-2 rounded-full bg-ink-950/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="size-3.5" aria-hidden />
        </span>
      </Artwork>
      {!portrait && (
        <div className="mt-2 px-0.5">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          {item.subtitle && <p className="truncate text-xs text-slate-400">{item.subtitle}</p>}
        </div>
      )}
      {portrait && item.subtitle && <p className="mt-1.5 truncate px-0.5 text-xs text-slate-400">{item.subtitle}</p>}
    </button>
  );
}
