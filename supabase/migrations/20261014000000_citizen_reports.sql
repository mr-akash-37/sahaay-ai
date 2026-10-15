-- Citizens can report wrong or outdated scheme information.
-- Reports land in the same admin review queue as n8n discoveries.
alter table public.discovery_events drop constraint discovery_events_event_type_check;
alter table public.discovery_events add constraint discovery_events_event_type_check check (
  event_type in (
    'new_scheme', 'deadline_change', 'benefit_change', 'eligibility_change',
    'link_broken', 'page_changed', 'citizen_report'
  )
);
