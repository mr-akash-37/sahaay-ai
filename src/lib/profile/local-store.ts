"use client";

import { useSyncExternalStore } from "react";
import type { DocumentStatuses } from "@/lib/engine/roadmap";
import type { CitizenProfile } from "@/lib/engine/types";
import { parseApplications, type ApplicationStatuses } from "./applications";
import { parseDocumentStatuses, parseProfile } from "./schema";

/**
 * Tiny localStorage-backed store for guest mode. Data never leaves the device.
 * All storage access is wrapped in try/catch: private browsing or blocked
 * storage simply behaves like "nothing saved yet".
 */
function createLocalStore<T>(key: string, parse: (value: unknown) => T | null) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: T | null = null;

  function readRaw(): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function getSnapshot(): T | null {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw === null ? null : parse(JSON.parse(raw));
      } catch {
        cachedValue = null;
      }
    }
    return cachedValue;
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    /** `undefined` until the browser has loaded (server render), then the value or null. */
    useValue(): T | null | undefined {
      return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
    },
    get: getSnapshot,
    set(value: T) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage unavailable: keep working for this page view only.
        cachedRaw = JSON.stringify(value);
        cachedValue = value;
      }
      emit();
    },
    clear() {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      cachedRaw = undefined;
      cachedValue = null;
      emit();
    },
  };
}

export const profileStore = createLocalStore<CitizenProfile>("sahaay.profile.v1", parseProfile);
export const documentStore = createLocalStore<DocumentStatuses>("sahaay.documents.v1", parseDocumentStatuses);

export const applicationStore = createLocalStore<ApplicationStatuses>("sahaay.applications.v1", parseApplications);
export const simpleModeStore = createLocalStore<boolean>("sahaay.simple.v1", (v) => (typeof v === "boolean" ? v : null));

export function clearAllLocalData() {
  profileStore.clear();
  documentStore.clear();
  applicationStore.clear();
}
