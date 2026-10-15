import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CircleCheck,
  ClipboardList,
  FileText,
  Gauge,
  Languages,
  MessageCircle,
  Route,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveLocale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const t = dict.landing;
  const checkHref = `/${locale}/check`;

  const steps: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: UserRound, title: t.step1Title, body: t.step1Body },
    { icon: ClipboardList, title: t.step2Title, body: t.step2Body },
    { icon: Route, title: t.step3Title, body: t.step3Body },
  ];

  const features: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: Gauge, title: t.featureMatchTitle, body: t.featureMatchBody },
    { icon: FileText, title: t.featureDocsTitle, body: t.featureDocsBody },
    { icon: BellRing, title: t.featureDeadlineTitle, body: t.featureDeadlineBody },
    { icon: Languages, title: t.featureLanguageTitle, body: t.featureLanguageBody },
    { icon: BadgeCheck, title: t.featureTrustTitle, body: t.featureTrustBody },
    { icon: MessageCircle, title: t.featureAssistantTitle, body: t.featureAssistantBody },
  ];

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-2 md:pt-16 md:pb-20">
        <div>
          <Badge tone="success">
            <CircleCheck aria-hidden="true" />
            {t.heroBadge}
          </Badge>
          <h1 className="mt-5 text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t.heroSubtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={checkHref} className={buttonVariants({ size: "lg" })}>
              {t.ctaPrimary}
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="#how" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              {t.ctaSecondary}
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t.ctaNote}</p>
          <Link
            href={`/${locale}/demo`}
            className="mt-3 inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {dict.demo.nav}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <ExampleMatchCard t={t} />
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="scroll-mt-20 border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="how-title" className="text-3xl font-bold tracking-tight">
            {t.howTitle}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="flex gap-4">
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Icon aria-hidden="true" className="size-6" />
                  <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="features-title" className="text-3xl font-bold tracking-tight text-balance">
          {t.featuresTitle}
        </h2>
        <p className="mt-2 text-muted-foreground">{t.statsLabel}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Card className="h-full">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon aria-hidden="true" className="size-6" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{body}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start gap-5 rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.ctaBandTitle}</h2>
            <p className="mt-2 opacity-90">{t.ctaBandBody}</p>
          </div>
          <Link
            href={checkHref}
            className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "border-transparent text-primary")}
          >
            {t.ctaPrimary}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

/** Illustrative preview of a result card. Clearly labelled as an example — not real data. */
function ExampleMatchCard({ t }: { t: Dictionary["landing"] }) {
  const met = [t.exampleMet1, t.exampleMet2, t.exampleMet3];
  return (
    <Card className="relative mx-auto w-full max-w-md shadow-lg" aria-label={t.exampleLabel}>
      <CardHeader className="pb-4">
        <Badge tone="neutral" className="w-fit">
          {t.exampleLabel}
        </Badge>
        <div className="mt-2 flex items-start justify-between gap-4">
          <CardTitle className="text-xl">{t.exampleScheme}</CardTitle>
          <div className="text-right">
            <p className="text-3xl leading-none font-bold text-success">93%</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.exampleMatch}</p>
          </div>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`93% ${t.exampleMatch}`}
        >
          <div className="h-full w-[93%] rounded-full bg-success" />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {met.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-success" />
              {item}
            </li>
          ))}
          <li className="flex items-center gap-2 font-medium text-warning-strong">
            <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-warning" />
            {t.exampleMissing}
          </li>
        </ul>
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
          <Route aria-hidden="true" className="size-5 shrink-0" />
          {t.exampleNext}
        </p>
      </CardContent>
    </Card>
  );
}
