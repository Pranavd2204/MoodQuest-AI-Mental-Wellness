import { Mic, SendHorizontal, Square } from "lucide-react";
import { useLayoutEffect, useRef, type FormEvent, type RefObject } from "react";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/cn";

export const MAX_MESSAGE_LENGTH = 2000;
const SILENCE_MS = 1500;

function joinText(base: string, spoken: string): string {
  return base && spoken ? `${base} ${spoken}` : base || spoken;
}

interface ChatComposerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  error: string | null;
  sendDisabled?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  onVoiceStart?: () => void;
  className?: string;
}

export function ChatComposer({
  id,
  value,
  onChange,
  onSend,
  error,
  sendDisabled,
  inputRef,
  onVoiceStart,
  className,
}: ChatComposerProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const baseTextRef = useRef("");
  const valueRef = useRef(value);
  valueRef.current = value;

  const speech = useSpeechRecognition({
    silenceMs: SILENCE_MS,
    onTranscript: (transcript) => onChange(joinText(baseTextRef.current, transcript)),
    onEnd: (transcript, { error: failed }) => {
      if (!failed && transcript) onSend(joinText(baseTextRef.current, transcript));
    },
  });

  useLayoutEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function toggleMic() {
    if (!speech.listening) {
      baseTextRef.current = valueRef.current.trim();
      onVoiceStart?.();
    }
    speech.toggle();
  }

  function send() {
    if (speech.listening) speech.stop();
    else onSend(value);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send();
  }

  const helpText = speech.listening ? null : (error ?? speech.error);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={cn(
          "flex items-end gap-1 rounded-[1.75rem] border bg-[rgb(22_28_45/0.72)] p-1.5 shadow-[0_12px_32px_-8px_rgb(7_9_14/0.7)] transition-colors focus-within:border-primary-500/70",
          error ? "border-rose-400/60" : speech.listening ? "border-sos/50" : "border-primary-300/15",
        )}
      >
        <button
          type="button"
          aria-label={speech.listening ? "Stop and send voice message" : "Start voice input"}
          title={speech.listening ? "Stop and send voice message" : "Start voice input"}
          aria-pressed={speech.listening}
          onClick={toggleMic}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
            speech.listening
              ? "sos-ring bg-sos/20 text-[#fb7185]"
              : "text-primary-200 hover:bg-primary-300/10 hover:text-white",
          )}
        >
          {speech.listening ? <Square className="size-4 fill-current" /> : <Mic className="size-5" />}
        </button>
        <label htmlFor={id} className="sr-only">
          Message
        </label>
        <textarea
          id={id}
          ref={(el) => {
            localRef.current = el;
            if (inputRef) inputRef.current = el;
          }}
          rows={1}
          value={value}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => {
            if (speech.error) speech.clearError();
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={speech.listening ? "Listening… speak now" : "Type a message…"}
          aria-invalid={!!error || undefined}
          aria-describedby={helpText || speech.listening ? `${id}-help` : undefined}
          className="scrollbar-none block max-h-32 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2.5 text-[15px] leading-5 text-white outline-none placeholder:text-primary-300/40"
        />
        <button
          type="submit"
          aria-label="Send message"
          title="Send message"
          disabled={sendDisabled}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_0_20px_rgb(139_141_248/0.5)] transition-all duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SendHorizontal className="size-[1.15rem]" />
        </button>
      </div>
      {speech.listening ? (
        <p id={`${id}-help`} role="status" className="mt-2 flex items-center gap-1.5 px-4 font-label text-xs tracking-[0.03em] text-[#fb7185]">
          <span className="size-2 animate-pulse rounded-full bg-sos" aria-hidden />
          Listening… pause when you're done and it sends automatically.
        </p>
      ) : (
        helpText && (
          <p
            id={`${id}-help`}
            role={error ? "alert" : "status"}
            className={cn("mt-2 px-4 text-xs", error ? "text-rose-300" : "text-astral-gold/90")}
          >
            {helpText}
          </p>
        )
      )}
    </form>
  );
}
