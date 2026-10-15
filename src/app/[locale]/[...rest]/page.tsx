import { notFound } from "next/navigation";

// This route only ever 404s, so there is no shell to validate for instant navigation.
export const instant = false;

// Unknown URLs under a locale render the translated [locale]/not-found page
// instead of Next's default English 404.
export default function CatchAll() {
  notFound();
}
