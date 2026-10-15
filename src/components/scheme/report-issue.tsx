"use client";

import { Flag } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";

/** "Report wrong information" — sends a short note to the admin review queue. */
export function ReportIssue({ slug, dict }: { slug: string; dict: Dictionary }) {
  const t = dict.report;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "short">("idle");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (message.trim().length < 10) return setState("short");
    setState("sending");
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, message: message.trim() }),
    }).catch(() => null);
    setState(response?.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <p role="status" className="rounded-xl bg-success-soft p-3 text-sm font-medium text-success-strong">
        {t.sent}
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="no-print text-muted-foreground">
        <Flag aria-hidden="true" />
        {t.button}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="no-print space-y-2 rounded-2xl border border-border bg-card p-4">
      <label htmlFor={`report-${slug}`} className="block font-semibold">
        {t.title}
      </label>
      <textarea
        id={`report-${slug}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={t.placeholder}
        className="block w-full rounded-xl border-2 border-border bg-background p-3 text-sm outline-none focus-visible:border-primary"
      />
      {state === "short" || state === "error" ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state === "short" ? t.tooShort : t.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={state === "sending"}>
          {t.send}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
}
