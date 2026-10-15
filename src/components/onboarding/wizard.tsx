"use client";

import { ArrowLeft, ArrowRight, ListChecks, Lock, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageSkeleton } from "@/components/state/page-skeleton";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CitizenProfile } from "@/lib/engine/types";
import { format } from "@/lib/format";
import { profileStore } from "@/lib/profile/local-store";
import {
  cleanProfile,
  decodeOption,
  encodeOption,
  optionLabel,
  visibleQuestions,
  type Question,
} from "@/lib/profile/questions";
import { cn } from "@/lib/utils";
import { DescribeBox } from "./describe-box";

type Props = { locale: Locale; dict: Dictionary; aiEnabled: boolean };
type Mode = "steps" | "words";

export function Wizard(props: Props) {
  const saved = profileStore.useValue();
  const [mode, setMode] = useState<Mode>("steps");
  const [resume, setResume] = useState<{ profile: CitizenProfile; key: number } | null>(null);

  if (saved === undefined) return <PageSkeleton label={props.dict.common.loading} />;

  const t = props.dict.describe;
  const tabs: { id: Mode; label: string; icon: typeof ListChecks }[] = [
    { id: "steps", label: t.tabSteps, icon: ListChecks },
    { id: "words", label: t.tabWords, icon: MessageSquareText },
  ];

  return (
    <div className="space-y-8">
      <div role="tablist" aria-label={t.title} className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold sm:text-base",
              mode === id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {mode === "words" ? (
        <DescribeBox
          locale={props.locale}
          dict={props.dict}
          aiEnabled={props.aiEnabled}
          onConfirm={(extracted) => {
            const merged = cleanProfile({ ...(profileStore.get() ?? {}), ...extracted });
            profileStore.set(merged);
            setResume({ profile: merged, key: Date.now() });
            setMode("steps");
          }}
        />
      ) : (
        <WizardSteps
          key={resume?.key ?? "initial"}
          locale={props.locale}
          dict={props.dict}
          initial={resume?.profile ?? saved ?? {}}
          startAtFirstUnanswered={resume !== null}
        />
      )}
    </div>
  );
}

function firstUnanswered(profile: CitizenProfile): number {
  const visible = visibleQuestions(profile);
  const index = visible.findIndex((q) => profile[q.field] === undefined);
  return index === -1 ? Math.max(visible.length - 1, 0) : index;
}

function WizardSteps({
  locale,
  dict,
  initial,
  startAtFirstUnanswered,
}: {
  locale: Locale;
  dict: Dictionary;
  initial: CitizenProfile;
  startAtFirstUnanswered: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<CitizenProfile>(initial);
  const [step, setStep] = useState(() => (startAtFirstUnanswered ? firstUnanswered(initial) : 0));
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  const visible = visibleQuestions(answers);
  const index = Math.min(step, visible.length - 1);
  const question = visible[index];
  const current = answers[question.field];
  const isLast = index === visible.length - 1;
  const text = dict.wizard.q[question.field];

  // Move focus to the new question so screen-reader users hear it.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  function update(value: CitizenProfile[keyof CitizenProfile] | undefined) {
    const next = cleanProfile({ ...answers, [question.field]: value });
    if (value === undefined) delete next[question.field];
    setAnswers(next);
    setError(null);
    profileStore.set(next); // autosave every answer
  }

  function goNext() {
    if (current === undefined) {
      setError(question.type === "number" ? dict.wizard.ageError : dict.wizard.chooseOne);
      return;
    }
    if (isLast) {
      profileStore.set(cleanProfile(answers));
      router.push(`/${locale}/results`);
      return;
    }
    setStep(index + 1);
  }

  const progress = Math.round(((index + 1) / visible.length) * 100);
  const errorId = `${question.field}-error`;
  const helpId = `${question.field}-help`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        goNext();
      }}
      noValidate
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
          {format(dict.wizard.progress, { current: index + 1, total: visible.length })}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <fieldset aria-describedby={error ? `${helpId} ${errorId}` : helpId}>
        <legend className="contents">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-balance outline-none sm:text-3xl">
            {text.title}
          </h1>
        </legend>
        <p id={helpId} className="mt-2 text-muted-foreground">
          {text.help}
        </p>

        {question.type === "number" ? (
          <NumberAnswer key={question.field} question={question} value={current} dict={dict} onChange={update} />
        ) : (
          <ChoiceAnswer question={question} value={current} dict={dict} onChange={update} />
        )}
      </fieldset>

      {error ? (
        <p id={errorId} role="alert" className="mt-4 font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        {index > 0 ? (
          <Button variant="secondary" size="lg" onClick={() => setStep(index - 1)}>
            <ArrowLeft aria-hidden="true" />
            {dict.wizard.back}
          </Button>
        ) : null}
        <Button type="submit" size="lg" className="flex-1">
          {isLast ? dict.wizard.finish : dict.wizard.next}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock aria-hidden="true" className="size-4" />
        {dict.wizard.privacy}
      </p>
    </form>
  );
}

const LONG_LIST = 12;

const optionClass = (checked: boolean, isUnknown: boolean) =>
  cn(
    "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-lg font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
    checked ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50",
    isUnknown && !checked && "border-dashed text-muted-foreground",
  );

function ChoiceAnswer({
  question,
  value,
  dict,
  onChange,
}: {
  question: Extract<Question, { type: "choice" }>;
  value: CitizenProfile[keyof CitizenProfile];
  dict: Dictionary;
  onChange: (value: CitizenProfile[keyof CitizenProfile] | undefined) => void;
}) {
  const options = [...question.options.map(encodeOption), "unknown"];
  // Long lists (states) are a dropdown so the page stays short on phones.
  if (question.options.length > LONG_LIST) {
    return (
      <div className="mt-6">
        <label htmlFor={`${question.field}-select`} className="sr-only">
          {dict.wizard.q[question.field].title}
        </label>
        <select
          id={`${question.field}-select`}
          value={value === undefined ? "" : encodeOption(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : (decodeOption(e.target.value) as CitizenProfile[keyof CitizenProfile]))
          }
          className="block min-h-14 w-full rounded-2xl border-2 border-border bg-card px-4 text-lg font-medium outline-none focus-visible:border-primary"
        >
          <option value="">{dict.wizard.chooseFromList}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {optionLabel(dict, question.field, decodeOption(option))}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-3">
      {options.map((option) => {
        const checked = value !== undefined && encodeOption(value) === option;
        return (
          <label key={option} className={optionClass(checked, option === "unknown")}>
            <input
              type="radio"
              name={question.field}
              value={option}
              checked={checked}
              onChange={() => onChange(decodeOption(option) as CitizenProfile[keyof CitizenProfile])}
              className="size-5 shrink-0 accent-[var(--primary)]"
            />
            {optionLabel(dict, question.field, decodeOption(option))}
          </label>
        );
      })}
    </div>
  );
}

function NumberAnswer({
  question,
  value,
  dict,
  onChange,
}: {
  question: Extract<Question, { type: "number" }>;
  value: CitizenProfile[keyof CitizenProfile];
  dict: Dictionary;
  onChange: (value: number | "unknown" | undefined) => void;
}) {
  const [text, setText] = useState(typeof value === "number" ? String(value) : "");
  const preferNot = value === "unknown";

  return (
    <div className="mt-6 grid gap-3">
      <label htmlFor={`${question.field}-input`} className="sr-only">
        {dict.wizard.agePlaceholder}
      </label>
      <input
        id={`${question.field}-input`}
        type="number"
        inputMode="numeric"
        min={question.min}
        max={question.max}
        value={text}
        placeholder={dict.wizard.agePlaceholder}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          const n = Number.parseInt(raw, 10);
          onChange(Number.isInteger(n) && n >= question.min && n <= question.max ? n : undefined);
        }}
        className="block min-h-14 w-full max-w-xs rounded-2xl border-2 border-border bg-card px-4 text-2xl font-semibold outline-none focus-visible:border-primary"
      />
      <label className={optionClass(preferNot, true)}>
        <input
          type="checkbox"
          checked={preferNot}
          onChange={(e) => {
            setText("");
            onChange(e.target.checked ? "unknown" : undefined);
          }}
          className="size-5 shrink-0 accent-[var(--primary)]"
        />
        {dict.wizard.preferNotToSay}
      </label>
    </div>
  );
}
