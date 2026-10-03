import { Volume2, VolumeX } from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

interface VoiceReplyToggleProps {
  supported: boolean;
  enabled: boolean;
  speaking: boolean;
  onToggle: () => void;
  className?: string;
}

export function VoiceReplyToggle({ supported, enabled, speaking, onToggle, className }: VoiceReplyToggleProps) {
  if (!supported) return null;
  return (
    <IconButton
      label={enabled ? "Turn off spoken replies" : "Turn on spoken replies"}
      aria-pressed={enabled}
      onClick={onToggle}
      className={cn(enabled && "text-primary-200", speaking && "animate-pulse border-primary-400/50", className)}
    >
      {enabled ? <Volume2 className="size-4.5" /> : <VolumeX className="size-4.5" />}
    </IconButton>
  );
}
