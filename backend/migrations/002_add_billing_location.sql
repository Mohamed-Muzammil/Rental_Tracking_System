ALTER TABLE clients ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS overdue_amount numeric not null default 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fine_amount numeric not null default 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS paid_fines numeric not null default 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_history jsonb not null default '[]'::jsonb;

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS current_location jsonb;
