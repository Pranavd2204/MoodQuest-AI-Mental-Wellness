import { ChevronRight, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ChatComposer, MAX_MESSAGE_LENGTH } from "@/components/chat/ChatComposer";
import { MessageBubble, TypingIndicator, type DisplayMessage } from "@/components/chat/ChatParts";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { VoiceReplyToggle } from "@/components/chat/VoiceReplyToggle";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/contexts/ToastContext";
import { useVoiceReplies } from "@/hooks/useVoiceReplies";
import { getErrorMessage } from "@/lib/api";
import { chatService } from "@/services/chatService";
import type { ConversationDetail } from "@/types";

const RECENT_MESSAGES = 4;

export function HomeChatCard() {
  const toast = useToast();
  const voice = useVoiceReplies();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<DisplayMessage | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const summaries = await chatService.listConversations();
      const latest = summaries?.[0];
      setConversation(latest ? await chatService.getConversation(latest.id) : null);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Couldn't load your conversation."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const messages: DisplayMessage[] = useMemo(() => {
    const recent = (conversation?.messages ?? []).slice(-RECENT_MESSAGES).map((m) => ({ ...m, key: `m${m.id}` }));
    return pending ? [...recent, pending] : recent;
  }, [conversation, pending]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  async function send(text: string) {
    if (sending) return;
    const content = text.trim();
    if (!content) {
      setInputError("Type or say a message first.");
      inputRef.current?.focus();
      return;
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      setInputError(`Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    setInputError(null);
    setSending(true);
    setInput("");
    setPending({ key: "pending", sender: "user", content, created_at: new Date().toISOString(), pending: true });

    try {
      const target = conversation ?? (await chatService.createConversation());
      const reply = await chatService.sendMessage(target.id, content);
      setConversation({ ...target, messages: [...target.messages, reply.user_message, reply.assistant_message] });
      setSuggestions(reply.suggestions);
      voice.speak(reply.assistant_message.content);
    } catch (error) {
      setInput(content);
      toast.error(getErrorMessage(error, "Your message wasn't sent. Please try again."));
    } finally {
      setPending(null);
      setSending(false);
    }
  }

  const chatLink = conversation ? `/chat?c=${conversation.id}` : "/chat";

  return (
    <section
      aria-labelledby="home-chat-title"
      className="glass reveal relative flex flex-col gap-4 overflow-hidden border-primary-400/25 p-5 shadow-[0_0_32px_-8px_rgb(139_141_248/0.35)]"
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary-500/20 blur-3xl" aria-hidden />
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="label-caps flex items-center gap-2 text-accent-400">
            <span className="size-2 rounded-full bg-accent-400 shadow-[0_0_8px_rgb(45_212_191)]" aria-hidden />
            AI Companion · Online
          </p>
          <h2 id="home-chat-title" className="mt-2 text-[22px] leading-7 font-semibold text-white">
            Need to talk or unwind?
          </h2>
          <p className="mt-1 text-sm text-slate-400">Share your thoughts with your gentle AI guide anytime.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <VoiceReplyToggle
            supported={voice.supported}
            enabled={voice.enabled}
            speaking={voice.speaking}
            onToggle={voice.toggle}
            className="size-10"
          />
          <Link
            to={chatLink}
            aria-label="Open chat"
            title="Open chat"
            className="flex size-10 items-center justify-center rounded-full border border-primary-300/15 bg-[rgb(22_28_45/0.65)] text-primary-200 transition hover:border-primary-300/35 hover:text-white"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scrollbar-none max-h-72 min-h-32 space-y-3 overflow-y-auto rounded-[1.25rem] border border-primary-300/[0.06] bg-[rgb(7_9_14/0.4)] p-3"
        aria-live="polite"
        aria-busy={sending}
      >
        {loading ? (
          <div className="space-y-3" aria-label="Loading conversation">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="ml-auto h-10 w-1/2" />
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => void load()} className="py-4" />
        ) : messages.length === 0 ? (
          <EmptyState
            compact
            icon={MessageCircle}
            title="Start a conversation with your AI companion."
            message="Type or tap the mic and tell it how your day is going."
          />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.key} message={message} />
            ))}
            {sending && <TypingIndicator />}
          </>
        )}
      </div>

      <SuggestionChips suggestions={suggestions} onSend={(text) => void send(text)} disabled={sending} />

      <ChatComposer
        id="home-chat-input"
        value={input}
        onChange={(value) => {
          setInput(value);
          if (inputError) setInputError(null);
        }}
        onSend={(text) => void send(text)}
        error={inputError}
        sendDisabled={sending || loading}
        inputRef={inputRef}
        onVoiceStart={voice.cancel}
      />
    </section>
  );
}
