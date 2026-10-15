"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

// Minimal typing for the Web Speech API (not in TypeScript's DOM lib everywhere).
type RecognitionResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const speechLang: Record<Locale, string> = { en: "en-IN", kn: "kn-IN", hi: "hi-IN" };
/** Stop on our own only after this long with no words at all. */
const SILENCE_LIMIT_MS = 15_000;
/** Safety cap for one press of the button. */
const SESSION_LIMIT_MS = 3 * 60_000;

type VoiceProblem = "unavailable" | "denied" | "noMic" | "noSpeech" | "network" | "language";

/** Maps Web Speech / getUserMedia errors to a message the citizen can act on. */
export function voiceProblemFor(error: string): VoiceProblem | null {
  switch (error) {
    case "aborted":
      return null; // the user pressed Stop
    case "not-allowed":
    case "NotAllowedError":
    case "SecurityError":
      return "denied";
    case "audio-capture":
    case "NotFoundError":
    case "NotReadableError":
      return "noMic";
    case "no-speech":
      return "noSpeech";
    case "language-not-supported":
      return "language";
    case "network":
    case "service-not-allowed":
      return "network";
    default:
      return "unavailable";
  }
}

/** Asks for the microphone first so the browser shows its permission prompt and we can explain a refusal. */
async function ensureMicrophone(): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null; // let speech recognition ask instead
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return null;
  } catch (error) {
    return error instanceof DOMException ? error.name : "unavailable";
  }
}

/** Speak instead of typing. Shows what it hears and explains any problem in plain words. */
export function VoiceButton({
  locale,
  dict,
  onText,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  onText: (text: string) => void;
  className?: string;
}) {
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [heard, setHeard] = useState("");
  const [problem, setProblem] = useState<VoiceProblem | null>(null);
  const recognition = useRef<Recognition | null>(null);
  // One listening session can span several browser recognitions (browsers stop after a pause).
  const session = useRef({ active: false, stopping: false, text: "", lastSpeech: 0, startedAt: 0 });
  const t = dict.describe;

  useEffect(
    () => () => {
      session.current.active = false;
      recognition.current?.abort();
    },
    [],
  );

  type Session = typeof session.current;

  /** Ends one session exactly once and hands over what was heard. Ignores sessions that were replaced. */
  function finish(s: Session, reason: VoiceProblem | null) {
    if (!s.active) return;
    s.active = false;
    if (s.text) onText(s.text);
    if (session.current !== s) return;
    recognition.current = null;
    setListening(false);
    setProblem(reason);
  }

  /** Starts one browser recognition. Called again after every automatic stop until the user presses Stop. */
  function listenOnce(Ctor: RecognitionCtor) {
    const s = session.current;
    const r = new Ctor();
    r.lang = speechLang[locale];
    r.interimResults = true;
    // One phrase per recognition, then we restart: continuous mode repeats words on Android Chrome.
    r.continuous = false;
    r.maxAlternatives = 1;
    let fatal: VoiceProblem | null = null;

    r.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) s.text = `${s.text} ${transcript}`.trim();
        else interim += transcript;
      }
      s.lastSpeech = Date.now();
      if (session.current === s) setHeard(`${s.text} ${interim}`.trim());
    };
    r.onerror = (event) => {
      const kind = voiceProblemFor(event.error);
      // A quiet moment is normal while someone thinks; only real failures end the session.
      if (kind && kind !== "noSpeech") fatal = kind;
    };
    r.onend = () => {
      if (!s.active) return;
      if (fatal) return finish(s, fatal);
      if (s.stopping) return finish(s, null);
      const now = Date.now();
      if (now - s.lastSpeech > SILENCE_LIMIT_MS) return finish(s, s.text ? null : "noSpeech");
      if (now - s.startedAt > SESSION_LIMIT_MS) return finish(s, null);
      try {
        listenOnce(Ctor);
      } catch {
        finish(s, null);
      }
    };
    if (session.current === s) recognition.current = r;
    r.start();
  }

  async function start() {
    setProblem(null);
    setHeard("");
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setProblem("unavailable");
      return;
    }

    setStarting(true);
    const micError = await ensureMicrophone();
    setStarting(false);
    if (micError) {
      setProblem(voiceProblemFor(micError));
      return;
    }

    const now = Date.now();
    session.current = { active: true, stopping: false, text: "", lastSpeech: now, startedAt: now };
    try {
      listenOnce(Ctor);
      setListening(true);
    } catch {
      session.current.active = false;
      setProblem("unavailable");
    }
  }

  function stop() {
    // Let the browser deliver the last phrase first; onend then finishes. Fallback if it never ends.
    const s = session.current;
    s.stopping = true;
    setListening(false);
    recognition.current?.stop();
    window.setTimeout(() => finish(s, null), 1500);
  }

  function toggle() {
    if (listening) stop();
    else void start();
  }

  const messages: Record<VoiceProblem, string> = {
    unavailable: t.voiceUnavailable,
    denied: t.voiceDenied,
    noMic: t.voiceNoMic,
    noSpeech: t.voiceNoSpeech,
    network: t.voiceNetwork,
    language: t.voiceLanguage,
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={listening ? "primary" : "secondary"}
          onClick={toggle}
          disabled={starting}
          aria-pressed={listening}
          className={cn(listening && "animate-pulse")}
        >
          {listening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          {listening ? t.stop : t.speak}
        </Button>
        {listening ? (
          <span role="status" className="text-sm font-medium text-primary">
            {heard ? `“${heard}”` : t.listening}
          </span>
        ) : null}
      </div>
      {problem ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {messages[problem]}
        </p>
      ) : null}
    </div>
  );
}
