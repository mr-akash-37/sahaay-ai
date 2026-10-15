import { Building2, Clock, ExternalLink, FileText, HelpCircle, MapPin, Package } from "lucide-react";
import type { ReactNode } from "react";
import type { DocumentInfo } from "@/data/documents";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Expandable explanation of one document: why, who issues it, where, what to bring. */
export function DocumentDetails({
  doc,
  locale,
  dict,
  children,
  defaultOpen = false,
}: {
  doc: DocumentInfo;
  locale: Locale;
  dict: Dictionary;
  children?: ReactNode;
  defaultOpen?: boolean;
}) {
  const t = dict.documents;
  return (
    <details className="group rounded-2xl border border-border bg-card" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <FileText aria-hidden="true" className="size-5 shrink-0 text-primary" />
        <span className="flex-1 font-semibold">{doc.name[locale]}</span>
        <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-3 border-t border-border px-4 py-4 text-sm">
        <Row icon={<HelpCircle />} label={t.why} value={doc.why[locale]} />
        <Row icon={<Building2 />} label={t.issuer} value={doc.issuer[locale]} />
        <Row icon={<MapPin />} label={t.where} value={doc.where[locale]} />
        <Row icon={<Package />} label={t.prerequisites} value={doc.prerequisites[locale]} />
        <Row icon={<Clock />} label="" value={t.time} />
        {doc.officialUrl ? (
          <a
            href={doc.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            {t.official}: {new URL(doc.officialUrl).hostname}
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only">{dict.scheme.opensNewTab}</span>
          </a>
        ) : null}
        {children}
      </div>
    </details>
  );
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <p>
        {label ? <span className="font-medium">{label}: </span> : null}
        <span className="text-muted-foreground">{value}</span>
      </p>
    </div>
  );
}
