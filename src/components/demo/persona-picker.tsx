"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { demoPersonas } from "@/data/demo-personas";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { profileStore } from "@/lib/profile/local-store";

export function PersonaPicker({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();

  function load(index: number) {
    if (profileStore.get() && !window.confirm(dict.demo.note)) return;
    profileStore.set(demoPersonas[index].profile);
    router.push(`/${locale}/results`);
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {demoPersonas.map((persona, index) => (
        <li key={persona.id}>
          <button
            type="button"
            onClick={() => load(index)}
            className="flex h-full w-full flex-col gap-2 rounded-2xl border-2 border-border bg-card p-5 text-left transition-colors hover:border-primary"
          >
            <span aria-hidden="true" className="text-4xl">
              {persona.emoji}
            </span>
            <span className="text-lg font-bold">{persona.name[locale]}</span>
            <span className="text-muted-foreground">{persona.story[locale]}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-2 font-semibold text-primary">
              {dict.demo.button}
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
