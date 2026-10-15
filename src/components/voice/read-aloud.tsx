"use client";

import { Square, Volume2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const voiceLang: Record<Locale, string> = { en: "en-IN", kn: "kn-IN", hi: "hi-IN" };
const noop = () => () => {};

/** 🔊 Reads text out loud in the page language. Hidden when the browser can't speak. */
export function ReadAloud({ text, locale, dict, size = "sm" }: { text: string; locale: Locale; dict: Dictionary; size?: "sm" | "md" }) {
  const supported = useSyncExternalStore(noop, () => "speechSynthesis" in window, () => false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[•✓✗?🔗]/g, " "));
    utterance.lang = voiceLang[locale];
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(locale));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  return (
    <Button variant="ghost" size={size} onClick={toggle} aria-pressed={speaking} className="no-print">
      {speaking ? <Square aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      {speaking ? dict.speech.stop : dict.speech.read}
    </Button>
  );
}
