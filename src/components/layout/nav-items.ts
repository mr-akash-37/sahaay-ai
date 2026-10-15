import type { Dictionary } from "@/i18n/dictionaries";

export type NavKey = "home" | "schemes" | "roadmap" | "assistant" | "profile";

/** Route path (after the locale prefix) for each main navigation item. */
export const navItems: { key: NavKey; path: string }[] = [
  { key: "home", path: "" },
  { key: "schemes", path: "/results" },
  { key: "roadmap", path: "/roadmap" },
  { key: "assistant", path: "/assistant" },
  { key: "profile", path: "/settings" },
];

export type NavLabels = Pick<Dictionary["nav"], NavKey | "label">;

export function isActivePath(pathname: string, locale: string, path: string): boolean {
  const href = `/${locale}${path}`;
  if (path === "") return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}
