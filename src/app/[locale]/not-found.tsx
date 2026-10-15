import { SearchX } from "lucide-react";
import Link from "next/link";
import { locale as rootLocale } from "next/root-params";
import { StatusMessage } from "@/components/state/status-message";
import { buttonVariants } from "@/components/ui/button";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function NotFound() {
  const requested = await rootLocale();
  const locale = hasLocale(requested) ? requested : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <StatusMessage icon={<SearchX />} title={dict.errors.notFoundTitle} body={dict.errors.notFoundBody}>
      <Link href={`/${locale}`} className={buttonVariants()}>
        {dict.common.goHome}
      </Link>
    </StatusMessage>
  );
}
