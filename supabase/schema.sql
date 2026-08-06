-- FleetLoop persistence schema.
-- Run this once in your Supabase project's SQL Editor (Project > SQL Editor > New query).
--
-- Scope: this backs the equipment roster, usage/telemetry logs, and misuse
-- incidents with a real Postgres database so they survive reloads and are
-- shared across browser sessions. Reference data that nothing in the app
-- currently edits (clients, sites, catalog, demand history) stays in the
-- static src/data/*.js files.
--
-- No login yet, so RLS policies below are intentionally permissive (anyone
-- holding the anon public key can read/write). That key ships in the
-- client bundle, so treat this as a demo/prototype security posture, not a
-- production one. Tightening this to per-user access is the natural next
-- step once real auth is added.

create table if not exists equipment (
  id                        text primary key,
  type                      text not null,
  tier                      text not null,
  catalog_id                text not null,
  status                    text not null default 'completed', -- 'active' | 'completed' | 'maintenance' | 'hold'
  site_id                   text,
  client_id                 text,
  operator_id               text,
  check_in                  date,
  check_out                 date,
  expected_return           date,
  rental_days               integer,
  avg_engine_hours_per_day  double precision not null default 0,
  avg_idle_hours_per_day    double precision not null default 0,
  maintenance_note          text,
  expected_back_on          date,
  return_requested          boolean not null default false,
  qr_code                   text
);

create table if not exists usage_logs (
  id             bigint generated always as identity primary key,
  equipment_id   text not null references equipment(id) on delete cascade,
  operator_id    text,
  date           date not null,
  engine_hours   double precision not null default 0,
  idle_hours     double precision not null default 0,
  fuel_usage_l   double precision not null default 0,
  location       jsonb,
  unique (equipment_id, date) -- one telemetry entry per unit per day; also what makes re-seeding idempotent
);

create index if not exists usage_logs_equipment_id_idx on usage_logs(equipment_id);
create index if not exists usage_logs_date_idx on usage_logs(date);

create table if not exists misuse_incidents (
  id                text primary key,
  equipment_id      text references equipment(id) on delete set null,
  type              text,
  title             text,
  severity          text,
  details           text,
  anomaly_score     integer,
  status            text not null default 'active', -- 'active' | 'resolved'
  created_at        text, -- display string, e.g. '2026-08-05 14:20'
  resolution        text,
  resolution_notes  text
);

-- Row Level Security: enabled, but wide open (no auth in this build yet).
alter table equipment enable row level security;
alter table usage_logs enable row level security;
alter table misuse_incidents enable row level security;

drop policy if exists "public access" on equipment;
create policy "public access" on equipment for all using (true) with check (true);

drop policy if exists "public access" on usage_logs;
create policy "public access" on usage_logs for all using (true) with check (true);

drop policy if exists "public access" on misuse_incidents;
create policy "public access" on misuse_incidents for all using (true) with check (true);
