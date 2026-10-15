"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { StatusMessage } from "@/components/state/status-message";
import { Button, buttonVariants } from "@/components/ui/button";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function LocaleError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = hasLocale(params?.locale) ? params.locale : defaultLocale;
  const dict = getDictionary(locale);

  useEffect(() => {
    // In production only the digest is logged (details stay on the server); in development, the full error.
    console.error("Page error", process.env.NODE_ENV === "development" ? error : (error.digest ?? ""));
  }, [error]);

  return (
    <StatusMessage icon={<TriangleAlert />} title={dict.errors.title} body={dict.errors.body}>
      <Button onClick={() => retry()}>
        <RefreshCw aria-hidden="true" />
        {dict.common.tryAgain}
      </Button>
      <Link href={`/${locale}`} className={buttonVariants({ variant: "secondary" })}>
        {dict.common.goHome}
      </Link>
    </StatusMessage>
  );
}
