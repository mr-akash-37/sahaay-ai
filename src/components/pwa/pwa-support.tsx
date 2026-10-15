"use client";

import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * Registers the service worker (production only — it would fight with the dev
 * server's hot reload), shows an offline banner and an "Install" prompt.
 */
export function PwaSupport({ dict }: { dict: Dictionary }) {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => undefined);
    setInstallEvent(null);
  }

  return (
    <>
      {!online ? (
        <div role="status" className="sticky top-16 z-30 flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-sm font-medium text-warning-strong">
          <WifiOff aria-hidden="true" className="size-4 shrink-0" />
          {dict.common.offline}
        </div>
      ) : null}

      {installEvent && !dismissed ? (
        <div className="fixed inset-x-3 bottom-40 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg lg:bottom-6">
          <Download aria-hidden="true" className="size-6 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">{dict.common.installTitle}</p>
            <p className="text-sm text-muted-foreground">{dict.common.installBody}</p>
          </div>
          <Button size="sm" onClick={install}>
            {dict.common.installButton}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} aria-label="Close">
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </>
  );
}
