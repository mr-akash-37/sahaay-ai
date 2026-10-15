import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import kn from "@/messages/kn.json";
import { defaultLocale, hasLocale, type Locale } from "./config";

/** English is the source of truth; other languages must have exactly the same keys. */
export type Dictionary = typeof en;

// Typed assignments make a missing translation key a compile-time error.
const knDictionary: Dictionary = kn;
const hiDictionary: Dictionary = hi;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  kn: knDictionary,
  hi: hiDictionary,
};

export function getDictionary(locale: string): Dictionary {
  return dictionaries[hasLocale(locale) ? locale : defaultLocale];
}
