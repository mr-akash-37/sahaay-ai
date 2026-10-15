import type { Metadata } from "next";
import { AuthCallback } from "@/components/account/auth-callback";
import { resolveLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = { robots: { index: false } };

export default async function AuthCallbackPage({ params }: PageProps<"/[locale]/auth/callback">) {
  const locale = resolveLocale((await params).locale);
  return <AuthCallback locale={locale} dict={getDictionary(locale)} />;
}
