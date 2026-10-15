"use client";

import { ArrowRight, Compass, Info, ListChecks, MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertsOptIn } from "@/components/account/alerts-opt-in";
import { ProfileChips } from "@/components/onboarding/profile-chips";
import { StatusBadge } from "@/components/scheme/badges";
import { ReadAloud } from "@/components/voice/read-aloud";
import { VoiceButton } from "@/components/voice/voice-button";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Scheme } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { answerWithoutAi, detectIntent } from "@/lib/ai/answer";
import { extractSituation } from "@/lib/ai/client";
import { extractProfileFromText } from "@/lib/ai/extract-rules";
import { nextBestQuestion } from "@/lib/engine/next-question";
import { isActionable, matchSchemes } from "@/lib/engine/roadmap";
import type { CitizenProfile, ProfileField } from "@/lib/engine/types";
import { format } from "@/lib/format";
import { documentStore, profileStore } from "@/lib/profile/local-store";
import { cleanProfile, decodeOption, encodeOption, optionLabel, type Question } from "@/lib/profile/questions";
import { useSchemes } from "@/lib/schemes/use-schemes";
import { cn } from "@/lib/utils";

type NewMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; profile?: CitizenProfile; question?: Question; results?: boolean };
type Message = NewMessage & { id: number };

const MAX = 1000;

/**
 * Sahaay Assistant — a conversation, not a form:
 * 1. The citizen says something like "I need financial support for my crops".
 * 2. We read what we can (AI if configured, otherwise the rule-based reader).
 * 3. We ask ONLY the next question that can still change a result, with tap-to-answer buttons.
 * 4. When nothing more is needed, we show the matching schemes with links.
 * Questions ("which documents?", "is it free?") are answered from verified data.
 */
export function Chat({
  locale,
  dict,
  aiEnabled,
  variant = "page",
  onClose,
  headingId,
}: {
  locale: Locale;
  dict: Dictionary;
  aiEnabled: boolean;
  /** "page" = the /assistant page; "panel" = the floating pop-up on every page. */
  variant?: "page" | "panel";
  onClose?: () => void;
  headingId?: string;
}) {
  const t = dict.assistant;
  const inputId = useId();
  const schemes = useSchemes();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<Question | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const push = (message: NewMessage) => {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { ...message, id }]);
  };

  /** Ask the next most useful question, or show the results when nothing is left to ask. */
  function continueConversation(profile: CitizenProfile) {
    const question = nextBestQuestion(profile, schemes);
    if (!question) {
      setPending(null);
      push({ role: "assistant", text: t.doneAsking, results: true });
      return;
    }
    const count = matchSchemes(schemes, profile).filter((m) => m.evaluation.status === "eligible").length;
    const prefix = count > 0 ? `${format(t.foundSoFar, { count })}\n` : "";
    setPending(question);
    push({ role: "assistant", text: `${prefix}${t.askNext}`, question });
  }

  function saveAnswers(extra: CitizenProfile): CitizenProfile {
    const merged = cleanProfile({ ...(profileStore.get() ?? {}), ...extra });
    profileStore.set(merged);
    return merged;
  }

  function answerPending(field: ProfileField, value: CitizenProfile[ProfileField], label: string) {
    push({ role: "user", text: label });
    continueConversation(saveAnswers({ [field]: value }));
  }

  /** Tries to read a typed reply as the answer to the pending question. */
  function readTypedAnswer(text: string): CitizenProfile[ProfileField] | undefined {
    if (!pending) return undefined;
    if (pending.type === "number") {
      const n = Number.parseInt(/\d{1,3}/.exec(text)?.[0] ?? "", 10);
      return Number.isInteger(n) && n >= pending.min && n <= pending.max ? n : undefined;
    }
    const value = extractProfileFromText(text).profile[pending.field];
    if (value !== undefined) return value;
    const t2 = text.trim().toLowerCase();
    if (pending.options.includes(true)) {
      if (/^(yes|y|haan|ha|ಹೌದು|हाँ|हां)\b/.test(t2)) return true;
      if (/^(no|n|nahi|illa|ಇಲ್ಲ|नहीं)\b/.test(t2)) return false;
    }
    return undefined;
  }

  async function send(raw: string) {
    const text = raw.trim().slice(0, MAX);
    if (!text || busy) return;
    setInput("");

    // A typed answer to the question we just asked.
    const typed = readTypedAnswer(text);
    if (pending && typed !== undefined) {
      answerPending(pending.field, typed, text);
      return;
    }

    push({ role: "user", text });
    setBusy(true);
    try {
      const intent = detectIntent(text);
      const local = extractProfileFromText(text);

      // The citizen is describing their situation → read it and keep the conversation going.
      if (local.fields.length > 0 && (intent === "unknown" || intent === "which")) {
        const extraction = local.fields.length >= 2 || text.length > 40 ? await extractSituation(text, aiEnabled) : { ...local, source: "rules" as const };
        push({ role: "assistant", text: t.detected, profile: extraction.profile });
        continueConversation(saveAnswers(extraction.profile));
        return;
      }

      // A question → AI grounded on verified data, or the rule-based assistant.
      const profile = profileStore.get();
      const statuses = documentStore.get() ?? {};
      if (aiEnabled) {
        const history = [...messages, { role: "user" as const, text }]
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.text }));
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, messages: history, profile, statuses }),
        }).catch(() => null);
        const body = (await response?.json().catch(() => null)) as { reply?: string } | null;
        if (response?.ok && body?.reply) {
          push({ role: "assistant", text: body.reply });
          return;
        }
      }
      push({ role: "assistant", text: answerWithoutAi({ question: text, profile, schemes, statuses, locale, dict }) });
    } catch {
      push({ role: "assistant", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  const lastId = messages.at(-1)?.id;
  const suggestions = messages.length === 0 ? [t.sExample, t.sWhich, t.sSafe] : [t.sWhich, t.sDocs, t.sNext, t.sSafe];

  const panel = variant === "panel";
  const Heading = panel ? "h2" : "h1";

  return (
    <div className={panel ? "flex h-full min-h-0 flex-col" : "flex min-h-[60vh] flex-col"}>
      <header className={cn("flex items-start justify-between gap-3", panel ? "mb-3" : "mb-4")}>
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <MessageCircle aria-hidden="true" className="size-6" />
          </div>
          <div>
            <Heading id={headingId} className={cn("font-bold tracking-tight", panel ? "text-lg" : "text-2xl")}>
              {t.title}
            </Heading>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info aria-hidden="true" className="size-3.5 shrink-0" />
              {aiEnabled ? t.modeAi : t.modeBasic}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={t.clear}
              onClick={() => {
                setMessages([]);
                setPending(null);
              }}
            >
              <Trash2 aria-hidden="true" />
              <span className={panel ? "sr-only" : undefined}>{t.clear}</span>
            </Button>
          ) : null}
          {onClose ? (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label={t.close}>
              <X aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </header>

      <div
        className={cn("flex-1 space-y-4", panel && "min-h-0 overflow-y-auto overscroll-contain pr-1")}
        role="log"
        aria-live="polite"
        aria-label={t.title}
      >
        <Bubble role="assistant" label={t.bot}>
          {t.intro}
        </Bubble>

        {messages.map((m) =>
          m.role === "user" ? (
            <Bubble key={m.id} role="user" label={t.you}>
              {m.text}
            </Bubble>
          ) : (
            <Bubble key={m.id} role="assistant" label={t.bot}>
              <p className="whitespace-pre-line">{m.text}</p>
              {!m.question && !m.profile && m.text.length > 40 ? (
                <div className="mt-1 -mb-1">
                  <ReadAloud text={m.text} locale={locale} dict={dict} />
                </div>
              ) : null}

              {m.profile ? (
                Object.keys(m.profile).length === 0 ? (
                  <p className="mt-2 text-muted-foreground">{dict.describe.nothingFound}</p>
                ) : (
                  <div className="mt-3">
                    <ProfileChips profile={m.profile} dict={dict} />
                  </div>
                )
              ) : null}

              {m.question ? (
                <QuestionReplies
                  question={m.question}
                  dict={dict}
                  active={m.id === lastId && pending?.field === m.question.field && !busy}
                  onAnswer={(value, label) => answerPending(m.question!.field, value, label)}
                  onShowNow={() => {
                    setPending(null);
                    push({ role: "assistant", text: t.doneAsking, results: true });
                  }}
                />
              ) : null}

              {m.results ? <InlineResults schemes={schemes} locale={locale} dict={dict} /> : null}
            </Bubble>
          ),
        )}

        {busy ? (
          <Bubble role="assistant" label={t.bot}>
            <span className="animate-pulse">{t.thinking}</span>
          </Bubble>
        ) : null}
        <div ref={endRef} />
      </div>

      <div
        className={cn(
          "space-y-2",
          panel
            ? "mt-3 border-t border-border pt-3"
            : "sticky bottom-20 mt-6 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur lg:bottom-4",
        )}
      >
        {/* One scrollable row, hidden while a question's answer buttons are showing (keeps the screen clear on phones). */}
        {pending ? null : (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                disabled={busy}
                className="min-h-9 shrink-0 rounded-full border border-border bg-card px-3 text-sm font-medium whitespace-nowrap hover:border-primary/50 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex items-end gap-2">
          <label htmlFor={inputId} className="sr-only">
            {t.placeholder}
          </label>
          <textarea
            id={inputId}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            maxLength={MAX}
            inputMode={pending?.type === "number" ? "numeric" : "text"}
            placeholder={pending?.type === "number" ? dict.wizard.agePlaceholder : t.placeholder}
            className="min-h-12 flex-1 resize-none rounded-xl border-2 border-border bg-card px-3 py-2.5 outline-none focus-visible:border-primary"
          />
          <Button type="submit" disabled={busy || !input.trim()} aria-label={t.send}>
            <Send aria-hidden="true" />
          </Button>
        </form>
        <VoiceButton
          locale={locale}
          dict={dict}
          onText={(spoken) => setInput((prev) => `${prev} ${spoken}`.trim().slice(0, MAX))}
          className="[&_button]:min-h-9 [&_button]:text-sm"
        />
      </div>
    </div>
  );
}

function QuestionReplies({
  question,
  dict,
  active,
  onAnswer,
  onShowNow,
}: {
  question: Question;
  dict: Dictionary;
  active: boolean;
  onAnswer: (value: CitizenProfile[ProfileField], label: string) => void;
  onShowNow: () => void;
}) {
  const text = dict.wizard.q[question.field];
  const options: string[] = question.type === "number" ? ["unknown"] : [...question.options.map(encodeOption), "unknown"];

  return (
    <div className="mt-3 space-y-3">
      <p className="text-lg font-semibold">{text.title}</p>
      <p className="text-sm text-muted-foreground">{question.type === "number" ? dict.assistant.typeAge : text.help}</p>
      {active && question.type === "choice" && question.options.length > 12 ? (
        <>
          <label className="sr-only" htmlFor={`${question.field}-reply`}>
            {text.title}
          </label>
          <select
            id={`${question.field}-reply`}
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              const value = decodeOption(e.target.value);
              onAnswer(value as CitizenProfile[ProfileField], optionLabel(dict, question.field, value));
            }}
            className="block min-h-11 w-full rounded-xl border-2 border-primary/40 bg-background px-3 text-base font-medium outline-none focus-visible:border-primary"
          >
            <option value="">{dict.wizard.chooseFromList}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {optionLabel(dict, question.field, decodeOption(option))}
              </option>
            ))}
          </select>
          <button type="button" onClick={onShowNow} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {dict.assistant.showNow}
          </button>
        </>
      ) : active ? (
        <>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const label =
                question.type === "number" && option === "unknown"
                  ? dict.wizard.preferNotToSay
                  : optionLabel(dict, question.field, decodeOption(option));
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onAnswer(decodeOption(option) as CitizenProfile[ProfileField], label)}
                  className={cn(
                    "min-h-11 rounded-xl border-2 px-3 py-2 text-left text-sm font-medium transition-colors hover:border-primary",
                    option === "unknown" ? "border-dashed border-border text-muted-foreground" : "border-primary/40 bg-primary-soft text-primary",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={onShowNow} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {dict.assistant.showNow}
          </button>
        </>
      ) : null}
    </div>
  );
}

function InlineResults({ schemes, locale, dict }: { schemes: Scheme[]; locale: Locale; dict: Dictionary }) {
  const profile = profileStore.useValue();
  if (!profile) return null;
  const matches = matchSchemes(schemes, profile).filter(isActionable).slice(0, 8);

  return (
    <div className="mt-3 space-y-3">
      {matches.length === 0 ? (
        <p className="text-muted-foreground">{dict.assistant.resultsEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {matches.map(({ scheme, evaluation }) => (
            <li key={scheme.slug}>
              <Link
                href={`/${locale}/schemes/${scheme.slug}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 hover:border-primary/50"
              >
                <span className="flex-1">
                  <span className="block font-semibold">{scheme.name[locale]}</span>
                  <span className="mt-1 block">
                    <StatusBadge status={evaluation.status} dict={dict} />
                  </span>
                </span>
                <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Link href={`/${locale}/results`} className={buttonVariants({ size: "sm" })}>
          <ListChecks aria-hidden="true" />
          {dict.assistant.openResults}
        </Link>
        <Link href={`/${locale}/roadmap`} className={buttonVariants({ size: "sm", variant: "secondary" })}>
          <Compass aria-hidden="true" />
          {dict.results.roadmapCta}
        </Link>
        <Link href={`/${locale}/check`} className={buttonVariants({ size: "sm", variant: "ghost" })}>
          <Pencil aria-hidden="true" />
          {dict.assistant.changeAnswers}
        </Link>
      </div>
      {matches.length > 0 ? <AlertsOptIn locale={locale} dict={dict} /> : null}
    </div>
  );
}

function Bubble({ role, label, children }: { role: "user" | "assistant"; label: string; children: ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[85%]",
          role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card",
        )}
      >
        <span className="sr-only">{label}: </span>
        {children}
      </div>
    </div>
  );
}
