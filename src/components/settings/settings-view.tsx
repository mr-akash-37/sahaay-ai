"use client";

import { Info, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AccountCard } from "@/components/account/account-card";
import { SimpleModeToggle } from "@/components/settings/simple-mode";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { clearAllLocalData, profileStore } from "@/lib/profile/local-store";
import { optionLabel, questions } from "@/lib/profile/questions";
import { useSession } from "@/lib/supabase/use-session";

export function SettingsView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const profile = profileStore.useValue();
  const session = useSession();
  const [message, setMessage] = useState("");
  const t = dict.settings;
  const hasData = !!profile && Object.keys(profile).length > 0;

  function deleteData() {
    if (!window.confirm(t.deleteConfirm)) return;
    clearAllLocalData();
    setMessage(t.deleted);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t.language}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher current={locale} label={t.language} className="w-fit" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{dict.simple.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleModeToggle dict={dict} />
        </CardContent>
      </Card>

      <AccountCard locale={locale} dict={dict} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t.dataTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {session.status === "signed_in" ? t.dataBodySignedIn : t.dataBody}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {profile === undefined ? (
            <div className="h-32 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
          ) : hasData ? (
            <dl className="divide-y divide-border rounded-xl border border-border">
              {questions.map(({ field }) => {
                const value = profile[field];
                return (
                  <div key={field} className="grid gap-1 px-4 py-3 sm:grid-cols-2 sm:gap-4">
                    <dt className="text-sm text-muted-foreground">{dict.wizard.q[field].title}</dt>
                    <dd className="font-medium">
                      {value === undefined ? t.notAnswered : optionLabel(dict, field, value)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="text-muted-foreground">{t.noData}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/check`} className={buttonVariants()}>
              <Pencil aria-hidden="true" />
              {t.edit}
            </Link>
            {hasData ? (
              <Button variant="secondary" onClick={deleteData} className="text-danger">
                <Trash2 aria-hidden="true" />
                {t.delete}
              </Button>
            ) : null}
          </div>
          <p role="status" className="font-medium text-success">
            {message}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info aria-hidden="true" className="size-5 text-primary" />
            {t.aboutTitle}
          </CardTitle>
          <p className="text-muted-foreground">{t.aboutBody}</p>
        </CardHeader>
      </Card>
    </div>
  );
}
