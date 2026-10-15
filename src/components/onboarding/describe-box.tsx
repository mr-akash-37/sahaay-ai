"use client";

import { Check, Lock, Pencil, Sparkles } from "lucide-react";
import { useState } from "react";
import { VoiceButton } from "@/components/voice/voice-button";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { extractSituation } from "@/lib/ai/client";
import type { CitizenProfile } from "@/lib/engine/types";
import { ProfileChips } from "./profile-chips";

const MAX = 1000;

/** "Describe your situation" — type or speak, then confirm what we understood. */
export function DescribeBox({
  locale,
  dict,
  aiEnabled,
  onConfirm,
}: {
  locale: Locale;
  dict: Dictionary;
  aiEnabled: boolean;
  onConfirm: (profile: CitizenProfile) => void;
}) {
  const t = dict.describe;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ profile: CitizenProfile; source: "ai" | "rules"; empty: boolean } | null>(null);

  async function analyse() {
    if (!text.trim() || text.length > MAX) return;
    setBusy(true);
    const extraction = await extractSituation(text.trim(), aiEnabled);
    setBusy(false);
    setResult({ profile: extraction.profile, source: extraction.source, empty: extraction.fields.length === 0 });
  }

  return (
    <section aria-labelledby="describe-title" className="space-y-4">
      <div>
        <h1 id="describe-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{t.body}</p>
        <p className="mt-2 rounded-xl bg-muted px-4 py-3 text-sm italic">“{t.example}”</p>
      </div>

      <label htmlFor="situation" className="block font-medium">
        {t.label}
      </label>
      <textarea
        id="situation"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        rows={5}
        maxLength={MAX}
        placeholder={t.placeholder}
        aria-describedby="situation-privacy"
        className="block w-full rounded-2xl border-2 border-border bg-card p-4 text-lg outline-none focus-visible:border-primary"
      />
      <p id="situation-privacy" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock aria-hidden="true" className="size-4 shrink-0" />
        {t.privacyNote}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <VoiceButton locale={locale} dict={dict} onText={(spoken) => setText((prev) => `${prev} ${spoken}`.trim().slice(0, MAX))} />
        <Button size="lg" onClick={analyse} disabled={busy || !text.trim()}>
          <Sparkles aria-hidden="true" />
          {busy ? t.analysing : t.analyse}
        </Button>
      </div>

      <div aria-live="polite">
        {result ? (
          result.empty ? (
            <p role="alert" className="rounded-2xl bg-warning-soft p-4 font-medium text-warning-strong">
              {t.nothingFound}
            </p>
          ) : (
            <div className="space-y-4 rounded-2xl border-2 border-primary bg-card p-4">
              <p className="font-semibold">{t.understood}</p>
              <ProfileChips profile={result.profile} dict={dict} />
              <p className="text-sm text-muted-foreground">{result.source === "ai" ? t.aiNote : t.rulesNote}</p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => onConfirm(result.profile)}>
                  <Check aria-hidden="true" />
                  {t.useThese}
                </Button>
                <Button variant="secondary" onClick={() => setResult(null)}>
                  <Pencil aria-hidden="true" />
                  {t.edit}
                </Button>
              </div>
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
