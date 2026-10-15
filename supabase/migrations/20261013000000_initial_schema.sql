-- Sahaay AI — initial schema
--
-- Principles
--  * Row Level Security on every table. Citizens only ever see their own rows.
--  * Scheme records are validated by the app (zod) before they are written; the
--    full record lives in `schemes.data` so the eligibility engine and the
--    database can never drift apart.
--  * Nothing from automation goes live directly: n8n creates `discovery_events`,
--    an admin approves them.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'citizen' check (role in ('citizen', 'admin')),
  locale text not null default 'en' check (locale in ('en', 'kn', 'hi')),
  email_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER so RLS policies can call it without recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Create a profile automatically for every new sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Citizens may edit their own preferences but never their role. Requests
-- without an end-user JWT (SQL editor, service role) may change roles.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- Citizen data (answers + document checklist)
-- ---------------------------------------------------------------------------

create table public.citizen_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  updated_at timestamptz not null default now()
);

create trigger citizen_profiles_updated_at before update on public.citizen_profiles
  for each row execute function public.set_updated_at();

create table public.user_documents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  statuses jsonb not null default '{}'::jsonb check (jsonb_typeof(statuses) = 'object'),
  updated_at timestamptz not null default now()
);

create trigger user_documents_updated_at before update on public.user_documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Schemes
-- ---------------------------------------------------------------------------

create table public.schemes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  trust text not null check (trust in ('verified', 'partially_verified', 'needs_review')),
  deadline date,
  last_reviewed date not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index schemes_status_idx on public.schemes (status);
create index schemes_deadline_idx on public.schemes (deadline) where deadline is not null;
create index schemes_last_reviewed_idx on public.schemes (last_reviewed);

create trigger schemes_updated_at before update on public.schemes
  for each row execute function public.set_updated_at();

-- Every published change is versioned. `notified_at` marks versions whose
-- alerts have been sent, so the alert job never sends the same alert twice.
create table public.scheme_versions (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes (id) on delete cascade,
  data jsonb not null,
  previous_data jsonb,
  change_summary text not null,
  changed_by uuid references auth.users (id) on delete set null,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index scheme_versions_scheme_idx on public.scheme_versions (scheme_id, created_at desc);
create index scheme_versions_pending_alerts_idx on public.scheme_versions (created_at) where notified_at is null;

-- ---------------------------------------------------------------------------
-- Discovery (n8n) → admin review queue
-- ---------------------------------------------------------------------------

create table public.discovery_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  source text not null,
  source_url text not null check (source_url ~ '^https://'),
  event_type text not null check (
    event_type in ('new_scheme', 'deadline_change', 'benefit_change', 'eligibility_change', 'link_broken', 'page_changed')
  ),
  title text not null,
  details text,
  scheme_slug text,
  proposed jsonb check (proposed is null or jsonb_typeof(proposed) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create index discovery_events_status_idx on public.discovery_events (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('new_match', 'scheme_updated', 'deadline')),
  scheme_slug text not null,
  scheme_version_id uuid references public.scheme_versions (id) on delete cascade,
  -- Prevents duplicate alerts, e.g. "new_match:<user>:<version>" or "deadline:<user>:<slug>:<date>:<days>".
  dedupe_key text not null unique,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.citizen_profiles enable row level security;
alter table public.user_documents enable row level security;
alter table public.schemes enable row level security;
alter table public.scheme_versions enable row level security;
alter table public.discovery_events enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- citizen_profiles
create policy "Users manage own answers" on public.citizen_profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- user_documents
create policy "Users manage own documents" on public.user_documents
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- schemes: everyone reads published; admins read everything. Writes go through
-- the review functions below (admins) or the service role.
create policy "Anyone reads published schemes" on public.schemes
  for select to anon, authenticated using (status = 'published');
create policy "Admins read all schemes" on public.schemes
  for select to authenticated using (public.is_admin());

-- scheme_versions / discovery_events / audit_log: admins only
create policy "Admins read versions" on public.scheme_versions
  for select to authenticated using (public.is_admin());
create policy "Admins read discovery events" on public.discovery_events
  for select to authenticated using (public.is_admin());
create policy "Admins read audit log" on public.audit_log
  for select to authenticated using (public.is_admin());

-- notifications: own rows; may only mark as read
create policy "Users read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users mark own notifications read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Only the read_at column may be changed by citizens.
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Admin review functions (SECURITY DEFINER, each checks is_admin()).
-- The app validates `scheme` with zod before calling.
-- ---------------------------------------------------------------------------

create or replace function public.publish_scheme(scheme jsonb, change_summary text, event_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text := scheme ->> 'slug';
  v_existing public.schemes;
  v_scheme_id uuid;
  v_version_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if v_slug is null or length(trim(change_summary)) = 0 then
    raise exception 'Scheme slug and change summary are required';
  end if;

  select * into v_existing from public.schemes where slug = v_slug for update;

  insert into public.schemes (slug, status, trust, deadline, last_reviewed, data, published_at)
  values (
    v_slug,
    'published',
    scheme ->> 'trust',
    nullif(scheme ->> 'deadline', '')::date,
    (scheme ->> 'lastReviewed')::date,
    scheme,
    now()
  )
  on conflict (slug) do update set
    status = 'published',
    trust = excluded.trust,
    deadline = excluded.deadline,
    last_reviewed = excluded.last_reviewed,
    data = excluded.data,
    published_at = now()
  returning id into v_scheme_id;

  insert into public.scheme_versions (scheme_id, data, previous_data, change_summary, changed_by)
  values (v_scheme_id, scheme, v_existing.data, change_summary, (select auth.uid()))
  returning id into v_version_id;

  if event_id is not null then
    update public.discovery_events
      set status = 'approved', reviewed_by = (select auth.uid()), reviewed_at = now()
      where id = event_id and status = 'pending';
  end if;

  insert into public.audit_log (actor, action, target, details)
  values ((select auth.uid()), 'scheme.publish', v_slug,
          jsonb_build_object('version_id', v_version_id, 'event_id', event_id, 'summary', change_summary));

  return v_version_id;
end;
$$;

create or replace function public.reject_discovery_event(event_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  update public.discovery_events
    set status = 'rejected', reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = note
    where id = event_id and status = 'pending';

  insert into public.audit_log (actor, action, target, details)
  values ((select auth.uid()), 'discovery.reject', event_id::text, jsonb_build_object('note', note));
end;
$$;

create or replace function public.archive_scheme(target_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  update public.schemes set status = 'archived' where slug = target_slug;

  insert into public.audit_log (actor, action, target)
  values ((select auth.uid()), 'scheme.archive', target_slug);
end;
$$;

revoke execute on function public.publish_scheme(jsonb, text, uuid) from public, anon;
revoke execute on function public.reject_discovery_event(uuid, text) from public, anon;
revoke execute on function public.archive_scheme(text) from public, anon;
grant execute on function public.publish_scheme(jsonb, text, uuid) to authenticated;
grant execute on function public.reject_discovery_event(uuid, text) to authenticated;
grant execute on function public.archive_scheme(text) to authenticated;
