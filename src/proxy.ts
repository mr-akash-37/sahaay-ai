import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, LOCALE_COOKIE, matchLocale } from "@/i18n/config";

/** Sends visitors without a language prefix to their saved or browser language. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (hasLocale(firstSegment)) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(saved) ? saved : matchLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals, generated app icons and any file with an extension (sw.js, manifest, images…).
  matcher: ["/((?!api|_next|app-icon|.*\\..*).*)"],
};
