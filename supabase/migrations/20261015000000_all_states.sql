-- Sahaay now serves every state. Stored data from the Karnataka-only version used
-- a yes/no "karnatakaResident" answer and Karnataka-only OBC categories. This
-- migration rewrites stored scheme rules and saved answers to the new fields so
-- nothing is silently skipped by the app's validator.
--
-- jsonb prints keys sorted by length, then alphabetically, with ", " and ": "
-- separators, so the patterns below match exactly what is stored.

create or replace function pg_temp.sahaay_all_states(doc jsonb) returns jsonb
language sql immutable as $$
  select replace(replace(replace(replace(replace(replace(replace(
    doc::text,
    -- Residence rule
    '"field": "karnatakaResident", "value": true',
    '"field": "state", "value": "ka"'),
    -- "Belongs to a Karnataka Backward Class category"
    '{"kind": "in", "field": "category", "values": ["obc_1", "obc_2a", "obc_3a", "obc_3b"]}',
    '{"kind": "allOf", "rules": [{"kind": "equals", "field": "category", "value": "obc"}, {"kind": "in", "field": "kaBackwardClass", "values": ["cat_1", "cat_2a", "cat_3a", "cat_3b"]}]}'),
    -- Income limits per Karnataka category
    '"field": "category", "values": ["obc_2a", "obc_3a", "obc_3b"]',
    '"field": "kaBackwardClass", "values": ["cat_2a", "cat_3a", "cat_3b"]'),
    '"field": "category", "value": "obc_1"',
    '"field": "kaBackwardClass", "value": "cat_1"'),
    '"field": "category", "value": "obc_2a"',
    '"field": "kaBackwardClass", "value": "cat_2a"'),
    '"field": "category", "value": "obc_3a"',
    '"field": "kaBackwardClass", "value": "cat_3a"'),
    '"field": "category", "value": "obc_3b"',
    '"field": "kaBackwardClass", "value": "cat_3b"')::jsonb
$$;

-- Scheme records (and pending proposals from the page monitor).
update public.schemes
set data = pg_temp.sahaay_all_states(data)
where data::text like '%karnatakaResident%' or data::text like '%"obc\_%' escape '\';

update public.discovery_events
set proposed = pg_temp.sahaay_all_states(proposed)
where proposed is not null
  and (proposed::text like '%karnatakaResident%' or proposed::text like '%"obc\_%' escape '\');

-- State schemes name their state (all stored state schemes so far are Karnataka's).
update public.schemes
set data = data || '{"state": "ka"}'::jsonb
where data->>'level' = 'state'
  and not (data ? 'state')
  and data::text like '%"field": "state", "value": "ka"%';

-- Saved citizen answers.
update public.citizen_profiles
set answers = (answers - 'karnatakaResident')
  || case when answers ? 'state' then '{}'::jsonb
          when answers->'karnatakaResident' = 'true'::jsonb then '{"state": "ka"}'::jsonb
          else '{"state": "unknown"}'::jsonb end
where answers ? 'karnatakaResident';

update public.citizen_profiles
set answers = answers
  || '{"category": "obc"}'::jsonb
  || case when answers ? 'kaBackwardClass' then '{}'::jsonb
          else jsonb_build_object('kaBackwardClass', 'cat_' || substr(answers->>'category', 5)) end
where answers->>'category' in ('obc_1', 'obc_2a', 'obc_3a', 'obc_3b');
