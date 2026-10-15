"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * The current path, but only after hydration. The shared layout (header, menus)
 * is prerendered once for every page, so its server HTML can't know the path;
 * returning `fallback` on the server and during hydration keeps the first client
 * render identical to that HTML (no hydration mismatch). React re-renders with
 * the real path immediately after.
 */
export function useHydratedPathname(fallback: string): string {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  return hydrated && pathname ? pathname : fallback;
}
