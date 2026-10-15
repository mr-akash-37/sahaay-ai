"use client";

import { MessageCircle } from "lucide-react";
import { useHydratedPathname } from "@/lib/use-hydrated-pathname";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Chat } from "./chat";

type Props = { locale: Locale; dict: Dictionary; aiEnabled: boolean };

/**
 * Floating "Ask Sahaay" button on every page. Opens the assistant in a panel
 * (full screen on phones) so citizens can clear doubts in their own language
 * without leaving the page they are on.
 */
export function AssistantLauncher(props: Props) {
  // The path is runtime data under Cache Components → keep it in Suspense (and read it after hydration).
  return (
    <Suspense fallback={null}>
      <Launcher {...props} />
    </Suspense>
  );
}

function Launcher({ locale, dict, aiEnabled }: Props) {
  const pathname = useHydratedPathname("");
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const wasOpen = useRef(false);

  // While open: Escape closes, focus starts in the message box.
  // After closing (any way): focus returns to the button, which is re-rendered by then.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) buttonRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector("textarea")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The full assistant page and the admin portal don't need the floating button.
  if (pathname.endsWith("/assistant") || pathname.includes("/admin")) return null;

  const close = () => setOpen(false);

  return (
    <>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className="fixed inset-0 z-50 flex flex-col bg-background p-4 sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100vh-3rem))] sm:w-[400px] sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl"
        >
          <Chat locale={locale} dict={dict} aiEnabled={aiEnabled} variant="panel" onClose={close} headingId={headingId} />
        </div>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-24 z-40 flex min-h-14 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 lg:right-6 lg:bottom-6"
        >
          <MessageCircle aria-hidden="true" className="size-6" />
          <span>{dict.assistant.openButton}</span>
        </button>
      )}
    </>
  );
}
