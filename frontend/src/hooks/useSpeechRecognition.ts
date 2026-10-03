import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const SPEECH_UNSUPPORTED_MESSAGE =
  "Voice input isn't supported in this browser. Try Chrome, Edge or Safari, or type your message instead.";

function describeError(code: string): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow the microphone in your browser's site settings and try again.";
    case "audio-capture":
      return "No microphone was found. Check that one is connected and not used by another app.";
    case "no-speech":
      return "Didn't catch that. Tap the mic and try speaking again.";
    case "network":
      return "Voice input needs an internet connection in this browser.";
    case "language-not-supported":
      return "Voice input doesn't support your browser's language yet.";
    case "aborted":
      return null;
    default:
      return "Voice input stopped unexpectedly. Please try again.";
  }
}

interface Options {
  onTranscript: (transcript: string) => void;
  onEnd?: (transcript: string, info: { error: boolean }) => void;
  silenceMs?: number;
}

export function useSpeechRecognition({ onTranscript, onEnd, silenceMs }: Options) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const silenceTimerRef = useRef<number | undefined>(undefined);

  const supported = !!getRecognitionConstructor();

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError(SPEECH_UNSUPPORTED_MESSAGE);
      return;
    }
    recognitionRef.current?.abort();
    setError(null);

    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let sessionTranscript = "";
    let sessionError = false;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      sessionTranscript = transcript.replace(/\s+/g, " ").trim();
      onTranscriptRef.current(sessionTranscript);
      if (silenceMs) {
        window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => recognition.stop(), silenceMs);
      }
    };
    recognition.onerror = (event) => {
      const message = describeError(event.error);
      if (message) {
        sessionError = true;
        setError(message);
      }
    };
    recognition.onend = () => {
      window.clearTimeout(silenceTimerRef.current);
      setListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      onEndRef.current?.(sessionTranscript, { error: sessionError });
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Voice input couldn't start. Please try again.");
      recognitionRef.current = null;
    }
  }, [silenceMs]);

  const toggle = useCallback(() => (recognitionRef.current ? stop() : start()), [start, stop]);

  useEffect(
    () => () => {
      window.clearTimeout(silenceTimerRef.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.abort();
      }
    },
    [],
  );

  return { supported, listening, error, clearError: () => setError(null), start, stop, toggle };
}
