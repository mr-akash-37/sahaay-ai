"use client";

import { Printer, Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { documents } from "@/data/documents";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { DocumentStep, SchemeMatch } from "@/lib/engine/roadmap";

/** Builds a plain-text checklist — no personal details, only scheme and document names. */
export function checklistText(steps: DocumentStep[], matches: SchemeMatch[], locale: Locale, dict: Dictionary): string {
  const t = dict.share;
  return [
    `📋 ${t.heading}`,
    "",
    t.docs,
    ...steps.map((s) => `${s.status === "have" ? "✅" : "⬜"} ${documents[s.documentId].name[locale]}`),
    "",
    t.schemes,
    ...matches.map((m) => `• ${m.scheme.name[locale]} — ${m.scheme.applyUrl}`),
  ].join("\n");
}

export function ShareChecklist({ text, dict }: { text: string; dict: Dictionary }) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "secondary", size: "sm" })}
      >
        <Share2 aria-hidden="true" />
        {dict.share.whatsapp}
      </a>
      <Button variant="secondary" size="sm" onClick={() => window.print()}>
        <Printer aria-hidden="true" />
        {dict.share.print}
      </Button>
    </div>
  );
}
