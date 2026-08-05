-- FleetLoop backend schema. Run once, by hand, in the Supabase Studio SQL
-- editor (Project -> SQL Editor -> New query -> paste -> Run). PostgREST
-- cannot execute DDL, so this file has no automated runner.
--
-- Field names mirror the JS fixture shapes 1:1 (snake_case here, converted
-- to camelCase by the FastAPI layer before it reaches the frontend).

create table if not exists sites (
  id text primary key,
  name text not null,
  region text not null,
  lat double precision not null,
  lng double precision not null,
  radius_km numeric not null
);

create table if not exists clients (
  id text primary key,
  name text not null,
  contact text not null,
  sites text[] not null default '{}'
);

create table if not exists catalog (
  id text primary key,
  type text not null,
  tier text not null,
  daily_cost numeric not null,
  min_usage_hrs numeric not null,
  max_usage_hrs numeric not null
);

create table if not exists equipment (
  id text primary key,
  type text not null check (type in ('Excavator','Bulldozer','Crane','Grader','Forklift','Loader','Roller')),
  tier text not null,
  catalog_id text references catalog(id),
  status text not null check (status in ('completed','active','maintenance','hold')),
  site_id text references sites(id),
  client_id text references clients(id),
  operator_id text,
  check_in date,
  check_out date,
  rental_days integer,
  expected_return date,
  avg_engine_hours_per_day numeric not null default 0,
  avg_idle_hours_per_day numeric not null default 0,
  maintenance_note text,
  expected_back_on date,
  return_requested boolean not null default false,
  qr_code text
);
create index if not exists idx_equipment_status on equipment(status);
create index if not exists idx_equipment_site on equipment(site_id);
create index if not exists idx_equipment_client on equipment(client_id);
create index if not exists idx_equipment_type on equipment(type);

create table if not exists usage_logs (
  id bigserial primary key,
  equipment_id text not null references equipment(id) on delete cascade,
  operator_id text,
  date date not null,
  engine_hours numeric not null,
  idle_hours numeric not null,
  fuel_usage_l numeric,
  location jsonb
);
create index if not exists idx_usage_logs_equipment_date on usage_logs(equipment_id, date desc);

create table if not exists misuse_incidents (
  id text primary key,
  equipment_id text references equipment(id) on delete cascade,
  type text not null check (type in ('geofence_breach','excessive_idle','unauthorized_operator','service_limit_exceeded')),
  title text not null,
  severity text not null check (severity in ('critical','medium','high','warning')),
  details text,
  anomaly_score numeric,
  status text not null default 'active' check (status in ('active','resolved')),
  created_at text not null,
  resolution text,
  resolution_notes text
);
create index if not exists idx_incidents_status on misuse_incidents(status);

-- No reset function needed here: POST /api/admin/reset deletes all rows
-- through PostgREST (DELETE ... WHERE id IS NOT NULL, per table, in
-- reverse-FK order) rather than TRUNCATE, so the exact same code path
-- works against both this real schema and the in-memory test fakes.
