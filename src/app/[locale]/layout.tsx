import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { CloudSync } from "@/components/account/cloud-sync";
import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { featureEnabled } from "@/lib/env";
import { BottomNav } from "@/components/layout/main-nav";
import { PwaSupport } from "@/components/pwa/pwa-support";
import { SimpleModeSync } from "@/components/settings/simple-mode";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { defaultLocale, hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import "../globals.css";

// Fonts ship with the app (from @fontsource), so pages never wait on — or fail because of — Google Fonts.
const inter = localFont({
  src: "../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});
const notoKannada = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-sans-kannada/files/noto-sans-kannada-kannada-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-kannada",
  display: "swap",
  preload: false,
});
const notoDevanagari = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: { default: dict.meta.title, template: `%s · ${dict.common.appName}` },
    description: dict.meta.description,
    applicationName: dict.common.appName,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#101418" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale: requested } = await params;
  const locale = hasLocale(requested) ? requested : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoKannada.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-base">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {dict.common.skipToContent}
        </a>
        <SiteHeader locale={locale} dict={dict} />
        <PwaSupport dict={dict} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} />
        <BottomNav locale={locale} labels={dict.nav} />
        <CloudSync locale={locale} />
        <SimpleModeSync />
        <AssistantLauncher locale={locale} dict={dict} aiEnabled={featureEnabled("ai")} />
      </body>
    </html>
  );
}
