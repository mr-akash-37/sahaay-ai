"use client";

import { useEffect } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { simpleModeStore } from "@/lib/profile/local-store";

/** Applies the saved "simple mode" (bigger text, stronger contrast) to the whole page. */
export function SimpleModeSync() {
  const on = simpleModeStore.useValue() === true;
  useEffect(() => {
    document.documentElement.classList.toggle("simple", on);
  }, [on]);
  return null;
}

export function SimpleModeToggle({ dict }: { dict: Dictionary }) {
  const value = simpleModeStore.useValue();
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3">
      <input
        type="checkbox"
        className="size-5 accent-[var(--primary)]"
        checked={value === true}
        disabled={value === undefined}
        onChange={(e) => simpleModeStore.set(e.target.checked)}
      />
      <span>
        <span className="block font-semibold">{dict.simple.toggle}</span>
        <span className="block text-sm text-muted-foreground">{dict.simple.body}</span>
      </span>
    </label>
  );
}
