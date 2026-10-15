import type { Metadata } from "next";
import { AdminView } from "@/components/admin/admin-view";
import { resolveLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "Admin portal", robots: { index: false } };

export default async function AdminPage({ params }: PageProps<"/[locale]/admin">) {
  const locale = resolveLocale((await params).locale);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <AdminView locale={locale} />
    </div>
  );
}
