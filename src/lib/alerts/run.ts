import "server-only";
import { resolveLocale } from "@/i18n/config";
import { featureEnabled, getServerEnv } from "@/lib/env";
import { sendEmail } from "@/lib/notify/email";
import { schemes as builtInSchemes, type Scheme } from "@/data/schemes";
import { mergePublished } from "@/lib/schemes/schema";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { composeAlertEmail } from "./compose";
import { planDeadlineReminders, planVersionAlerts, type PlannedAlert, type ProfileInput } from "./plan";

export type AlertRunSummary = {
  versionsProcessed: number;
  alertsCreated: number;
  emailsSent: number;
  emailEnabled: boolean;
};

const PAGE = 1000;

async function loadProfiles(): Promise<ProfileInput[]> {
  const db = getAdminSupabase();
  const profiles: ProfileInput[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("citizen_profiles")
      .select("user_id, answers")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Could not load profiles (${error.code})`);
    for (const row of data ?? []) profiles.push({ userId: row.user_id as string, answers: row.answers });
    if (!data || data.length < PAGE) return profiles;
  }
}

/**
 * The alert job (run daily by cron, or on demand by an admin):
 * 1. find published scheme versions not yet notified
 * 2. decide who to alert with the eligibility engine
 * 3. add deadline reminders (7/3/1 days)
 * 4. save in-app notifications (duplicates are ignored)
 * 5. email citizens who have alerts on (if email is configured)
 * 6. mark the versions as notified
 */
export async function runAlerts(today = new Date()): Promise<AlertRunSummary> {
  const db = getAdminSupabase();

  const { data: versions, error: versionsError } = await db
    .from("scheme_versions")
    .select("id, data, previous_data")
    .is("notified_at", null)
    .order("created_at")
    .limit(50);
  if (versionsError) throw new Error(`Could not load versions (${versionsError.code})`);

  const { data: published, error: schemesError } = await db.from("schemes").select("data").eq("status", "published");
  if (schemesError) throw new Error(`Could not load schemes (${schemesError.code})`);
  const schemes = mergePublished((published ?? []).map((row) => row.data), builtInSchemes);

  const profiles = await loadProfiles();

  const planned: PlannedAlert[] = [
    ...planVersionAlerts(
      (versions ?? []).map((v) => ({ versionId: v.id as string, data: v.data, previousData: v.previous_data })),
      profiles,
    ),
    ...planDeadlineReminders(schemes, profiles, today),
  ];

  let created: { id: string; user_id: string; kind: PlannedAlert["kind"]; scheme_slug: string }[] = [];
  if (planned.length > 0) {
    const { data, error } = await db
      .from("notifications")
      .upsert(
        planned.map((a) => ({
          user_id: a.userId,
          kind: a.kind,
          scheme_slug: a.schemeSlug,
          scheme_version_id: a.schemeVersionId,
          dedupe_key: a.dedupeKey,
        })),
        { onConflict: "dedupe_key", ignoreDuplicates: true },
      )
      .select("id, user_id, kind, scheme_slug");
    if (error) throw new Error(`Could not save notifications (${error.code})`);
    created = data ?? [];
  }

  const emailEnabled = featureEnabled("email");
  const emailsSent = emailEnabled ? await emailCitizens(created, schemes) : 0;

  const versionIds = (versions ?? []).map((v) => v.id as string);
  if (versionIds.length > 0) {
    const { error } = await db.from("scheme_versions").update({ notified_at: new Date().toISOString() }).in("id", versionIds);
    if (error) throw new Error(`Could not mark versions (${error.code})`);
  }

  return { versionsProcessed: versionIds.length, alertsCreated: created.length, emailsSent, emailEnabled };
}

async function emailCitizens(
  created: { id: string; user_id: string; kind: PlannedAlert["kind"]; scheme_slug: string }[],
  schemes: Scheme[],
): Promise<number> {
  if (created.length === 0) return 0;
  const db = getAdminSupabase();
  const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const byUser = new Map<string, typeof created>();
  for (const row of created) byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);

  const { data: prefs } = await db
    .from("profiles")
    .select("id, locale, email_alerts")
    .in("id", [...byUser.keys()]);
  const prefById = new Map((prefs ?? []).map((p) => [p.id as string, p]));

  let sent = 0;
  for (const [userId, rows] of byUser) {
    const pref = prefById.get(userId);
    if (!pref?.email_alerts) continue;

    const { data: user } = await db.auth.admin.getUserById(userId);
    const email = user.user?.email;
    if (!email) continue;

    const locale = resolveLocale(pref.locale as string);
    const message = composeAlertEmail(
      locale,
      appUrl,
      rows.map((r) => ({
        kind: r.kind,
        schemeSlug: r.scheme_slug,
        schemeName: schemes.find((s) => s.slug === r.scheme_slug)?.name[locale] ?? r.scheme_slug,
      })),
    );

    if (await sendEmail({ to: email, ...message })) {
      sent += 1;
      await db
        .from("notifications")
        .update({ emailed_at: new Date().toISOString() })
        .in(
          "id",
          rows.map((r) => r.id),
        );
    }
  }
  return sent;
}
