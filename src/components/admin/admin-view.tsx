"use client";

import { Bell, ClipboardCheck, ExternalLink, FileJson, History, Library, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusMessage } from "@/components/state/status-message";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Scheme } from "@/data/schemes";
import { schemes as builtInSchemes } from "@/data/schemes";
import type { Locale } from "@/i18n/config";
import { parseScheme } from "@/lib/schemes/schema";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useIsAdmin, useSession } from "@/lib/supabase/use-session";
import { cn } from "@/lib/utils";

// The admin portal is English-only; citizen pages are fully translated.

type DiscoveryEvent = {
  id: string;
  source: string;
  source_url: string;
  event_type: string;
  title: string;
  details: string | null;
  scheme_slug: string | null;
  proposed: unknown;
  created_at: string;
};

type SchemeRow = { slug: string; status: string; trust: string; last_reviewed: string; data: unknown };
type AuditRow = { id: number; action: string; target: string | null; created_at: string };

const STALE_DAYS = 90;
const tabs = [
  { id: "queue", label: "Review queue", icon: ClipboardCheck },
  { id: "schemes", label: "Schemes", icon: Library },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "audit", label: "Audit log", icon: History },
] as const;
type Tab = (typeof tabs)[number]["id"];

export function AdminView({ locale }: { locale: Locale }) {
  const session = useSession();
  const isAdmin = useIsAdmin(session);

  if (session.status === "disabled") {
    return <StatusMessage icon={<ShieldAlert />} title="Admin portal" body="Supabase is not configured." />;
  }
  if (session.status === "loading" || isAdmin === undefined) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" role="status" aria-label="Loading" />;
  }
  if (session.status !== "signed_in" || !isAdmin) {
    return (
      <StatusMessage icon={<ShieldAlert />} title="Admins only" body="Sign in with an admin account to continue.">
        <Link href={`/${locale}/settings`} className={buttonVariants()}>
          Go to sign in
        </Link>
      </StatusMessage>
    );
  }
  return <AdminPortal accessToken={session.accessToken} />;
}

function AdminPortal({ accessToken }: { accessToken: string }) {
  const [tab, setTab] = useState<Tab>("queue");
  const [events, setEvents] = useState<DiscoveryEvent[] | null>(null);
  const [rows, setRows] = useState<SchemeRow[] | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [editing, setEditing] = useState<{ json: string; eventId: string | null } | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [reload, setReload] = useState(0);

  const refresh = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let active = true;
    Promise.all([
      supabase
        .from("discovery_events")
        .select("id, source, source_url, event_type, title, details, scheme_slug, proposed, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("schemes").select("slug, status, trust, last_reviewed, data").order("slug"),
      supabase.from("audit_log").select("id, action, target, created_at").order("created_at", { ascending: false }).limit(50),
    ]).then(([e, s, a]) => {
      if (!active) return;
      setEvents((e.data ?? []) as DiscoveryEvent[]);
      setRows((s.data ?? []) as SchemeRow[]);
      setAudit((a.data ?? []) as AuditRow[]);
    });
    return () => {
      active = false;
    };
  }, [reload]);

  const today = new Date();
  const stale = (rows ?? []).filter(
    (r) => r.status === "published" && (today.getTime() - Date.parse(r.last_reviewed)) / 86_400_000 > STALE_DAYS,
  );

  function openEditor(scheme: unknown, eventId: string | null) {
    setNotice(null);
    setEditing({ json: JSON.stringify(scheme, null, 2), eventId });
  }

  async function reject(event: DiscoveryEvent) {
    const note = window.prompt("Reason (optional) — e.g. 'No change needed'") ?? "";
    const { error } = await getBrowserSupabase()!.rpc("reject_discovery_event", { event_id: event.id, note });
    setNotice(error ? { tone: "error", text: error.message } : { tone: "ok", text: "Event closed." });
    refresh();
  }

  async function runAlerts() {
    setNotice(null);
    const response = await fetch("/api/alerts/run", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response?.ok || !body) {
      setNotice({ tone: "error", text: `Alert run failed${body?.error ? `: ${String(body.error)}` : ""}` });
      return;
    }
    setNotice({
      tone: "ok",
      text: `Done. Versions processed: ${body.versionsProcessed}, alerts created: ${body.alertsCreated}, emails sent: ${body.emailsSent}${body.emailEnabled ? "" : " (email not configured)"}.`,
    });
    refresh();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Admin portal</h1>
        <p className="mt-1 text-muted-foreground">
          Nothing reaches citizens until it is approved here. Approving publishes the scheme and queues alerts.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Pending review" value={events?.length} tone={events?.length ? "warning" : "neutral"} />
        <Stat label="Published schemes" value={rows?.filter((r) => r.status === "published").length} />
        <Stat label="Drafts / archived" value={rows?.filter((r) => r.status !== "published").length} />
        <Stat label={`Not reviewed in ${STALE_DAYS} days`} value={stale.length} tone={stale.length ? "danger" : "neutral"} />
      </dl>

      <div role="tablist" aria-label="Admin sections" className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-medium",
              tab === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {notice ? (
        <p role="status" className={cn("rounded-xl p-3 font-medium", notice.tone === "ok" ? "bg-success-soft text-success-strong" : "bg-danger-soft text-danger")}>
          {notice.text}
        </p>
      ) : null}

      {editing ? (
        <SchemeEditor
          initialJson={editing.json}
          eventId={editing.eventId}
          onCancel={() => setEditing(null)}
          onPublished={(slug) => {
            setEditing(null);
            setNotice({ tone: "ok", text: `Published "${slug}". Run alerts to notify citizens now, or wait for the daily job.` });
            refresh();
          }}
        />
      ) : null}

      <div role="tabpanel">
        {tab === "queue" ? (
          <QueueTab
            events={events}
            rows={rows}
            onReview={(event) => {
              const proposed = event.proposed ?? currentScheme(rows, event.scheme_slug);
              openEditor(proposed ?? newSchemeTemplate(), event.id);
            }}
            onReject={reject}
          />
        ) : null}
        {tab === "schemes" ? (
          <SchemesTab rows={rows} onEdit={(row) => openEditor(row.data, null)} onNew={() => openEditor(newSchemeTemplate(), null)} />
        ) : null}
        {tab === "alerts" ? (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <p>
              Alerts run automatically once a day (Vercel Cron). They check newly published scheme versions against every saved
              citizen profile using the eligibility engine, and send deadline reminders 7, 3 and 1 days before a verified deadline.
            </p>
            <Button onClick={runAlerts}>
              <Bell aria-hidden="true" />
              Send alerts now
            </Button>
          </section>
        ) : null}
        {tab === "audit" ? <AuditTab audit={audit} /> : null}
      </div>
    </div>
  );
}

function currentScheme(rows: SchemeRow[] | null, slug: string | null): unknown {
  if (!slug) return null;
  return rows?.find((r) => r.slug === slug)?.data ?? builtInSchemes.find((s) => s.slug === slug) ?? null;
}

function newSchemeTemplate(): Scheme {
  const template = JSON.parse(JSON.stringify(builtInSchemes[0])) as Scheme;
  return {
    ...template,
    slug: "new-scheme-slug",
    trust: "needs_review",
    lastReviewed: new Date().toISOString().slice(0, 10),
    deadline: null,
  };
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number | undefined; tone?: "neutral" | "warning" | "danger" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 text-3xl font-bold", tone === "warning" && "text-warning-strong", tone === "danger" && "text-danger")}>
        {value ?? "…"}
      </dd>
    </div>
  );
}

function QueueTab({
  events,
  rows,
  onReview,
  onReject,
}: {
  events: DiscoveryEvent[] | null;
  rows: SchemeRow[] | null;
  onReview: (event: DiscoveryEvent) => void;
  onReject: (event: DiscoveryEvent) => void;
}) {
  if (!events) return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  if (events.length === 0) {
    return <p className="rounded-2xl border border-border bg-card p-5 text-muted-foreground">Nothing to review. 🎉</p>;
  }
  return (
    <ul className="space-y-3">
      {events.map((event) => {
        const proposal = event.proposed ? parseScheme(event.proposed) : null;
        const existing = event.scheme_slug && rows?.some((r) => r.slug === event.scheme_slug);
        return (
          <li key={event.id} className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning">{event.event_type.replaceAll("_", " ")}</Badge>
              <span className="text-sm text-muted-foreground">
                {event.source} · {new Date(event.created_at).toLocaleString("en-IN")}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{event.title}</h3>
            {event.details ? <p className="whitespace-pre-wrap text-muted-foreground">{event.details}</p> : null}
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline"
            >
              {event.source_url}
              <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
            </a>
            <p className="text-sm">
              {proposal
                ? proposal.ok
                  ? "✅ Includes a valid proposed scheme record."
                  : `⚠️ Proposed record is invalid: ${proposal.errors.slice(0, 3).join("; ")}`
                : existing
                  ? `Affects existing scheme "${event.scheme_slug}". Open it, check the official page, and update.`
                  : "No proposed record. Check the source and create or update a scheme if needed."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onReview(event)}>
                <FileJson aria-hidden="true" />
                Review &amp; publish
              </Button>
              <Button variant="secondary" onClick={() => onReject(event)}>
                Close without changes
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SchemesTab({
  rows,
  onEdit,
  onNew,
}: {
  rows: SchemeRow[] | null;
  onEdit: (row: SchemeRow) => void;
  onNew: () => void;
}) {
  if (!rows) return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  const missing = builtInSchemes.filter((s) => !rows.some((r) => r.slug === s.slug));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onNew}>
          <FileJson aria-hidden="true" />
          New scheme
        </Button>
        {missing.length > 0 ? <ImportBuiltIns missing={missing} /> : null}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Trust</th>
              <th className="p-3 font-medium">Last reviewed</th>
              <th className="p-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{row.slug}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{row.trust.replaceAll("_", " ")}</td>
                <td className="p-3">{row.last_reviewed}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Publishes built-in schemes that a (cloud) database doesn't have yet — e.g. after an app update. */
function ImportBuiltIns({ missing }: { missing: Scheme[] }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function importAll() {
    if (!window.confirm(`Publish ${missing.length} built-in scheme(s)?\n\n${missing.map((s) => s.slug).join("\n")}`)) return;
    setState("busy");
    const supabase = getBrowserSupabase()!;
    for (const scheme of missing) {
      const { error } = await supabase.rpc("publish_scheme", {
        scheme,
        change_summary: "Imported built-in scheme from app data",
        event_id: null,
      });
      if (error) {
        setState("error");
        setMessage(`${scheme.slug}: ${error.message}`);
        return;
      }
    }
    setState("done");
    setMessage(`Imported ${missing.length} scheme(s). Reload to see them.`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={importAll} disabled={state === "busy" || state === "done"}>
        <Library aria-hidden="true" />
        Import new built-in schemes ({missing.length})
      </Button>
      {message ? (
        <span role="status" className={cn("text-sm font-medium", state === "error" ? "text-danger" : "text-success")}>
          {message}
        </span>
      ) : null}
    </div>
  );
}

function AuditTab({ audit }: { audit: AuditRow[] | null }) {
  if (!audit) return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  if (audit.length === 0) return <p className="text-muted-foreground">No activity yet.</p>;
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {audit.map((row) => (
        <li key={row.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
          <span>
            <span className="font-medium">{row.action}</span> {row.target}
          </span>
          <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString("en-IN")}</span>
        </li>
      ))}
    </ul>
  );
}

function SchemeEditor({
  initialJson,
  eventId,
  onCancel,
  onPublished,
}: {
  initialJson: string;
  eventId: string | null;
  onCancel: () => void;
  onPublished: (slug: string) => void;
}) {
  const [json, setJson] = useState(initialJson);
  const [summary, setSummary] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function publish() {
    let value: unknown;
    try {
      value = JSON.parse(json);
    } catch {
      setErrors(["The text is not valid JSON."]);
      return;
    }
    const result = parseScheme(value);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (summary.trim().length < 5) {
      setErrors(["Write a short change summary (what changed and which official source you checked)."]);
      return;
    }
    setBusy(true);
    const { error } = await getBrowserSupabase()!.rpc("publish_scheme", {
      scheme: result.scheme,
      change_summary: summary.trim(),
      event_id: eventId,
    });
    setBusy(false);
    if (error) setErrors([error.message]);
    else onPublished(result.scheme.slug);
  }

  return (
    <section aria-label="Scheme editor" className="space-y-3 rounded-2xl border-2 border-primary bg-card p-5">
      <h2 className="text-xl font-bold">Review scheme record</h2>
      <p className="text-sm text-muted-foreground">
        Check every value against the official source. Leave <code>deadline</code> as <code>null</code> unless it is officially
        announced. Use <code>&quot;trust&quot;: &quot;verified&quot;</code> only after checking the current notification.
      </p>
      <label htmlFor="scheme-json" className="block font-medium">
        Scheme JSON
      </label>
      <textarea
        id="scheme-json"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        spellCheck={false}
        rows={18}
        className="w-full rounded-xl border-2 border-border bg-background p-3 font-mono text-xs outline-none focus-visible:border-primary"
      />
      <label htmlFor="change-summary" className="block font-medium">
        Change summary
      </label>
      <input
        id="change-summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="e.g. Deadline announced on SSP notice dated …"
        className="block min-h-11 w-full rounded-xl border-2 border-border bg-background px-3 outline-none focus-visible:border-primary"
      />
      {errors.length > 0 ? (
        <ul role="alert" className="list-disc space-y-1 rounded-xl bg-danger-soft p-3 pl-8 text-sm text-danger">
          {errors.slice(0, 10).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={publish} disabled={busy}>
          Validate &amp; publish
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
