// One-time / re-runnable seed: loads the existing mock dataset
// (src/data/equipment.js + usageLogs.js) plus the demo misuse incidents into
// Supabase. Safe to re-run — everything upserts on a stable key.
//
// Usage: npm run seed
// Requires .env.local with VITE_SUPABASE_URL and either SUPABASE_SECRET_KEY
// (preferred, bypasses RLS) or VITE_SUPABASE_ANON_KEY (works too, since the
// schema's RLS policies are open in this no-auth build).

import { createClient } from '@supabase/supabase-js'
import { equipment } from '../src/data/equipment.js'
import { usageLogs } from '../src/data/usageLogs.js'
import { equipmentToRow, usageLogToRow, incidentToRow } from '../src/lib/db.js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or a key (SUPABASE_SECRET_KEY / VITE_SUPABASE_ANON_KEY) in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

// Same four demo incidents previously hardcoded in the Zustand store.
const seedIncidents = [
  {
    id: 'INC-101',
    equipmentId: 'EQX-2003',
    type: 'geofence_breach',
    title: 'Outside Assigned Site (Geofence Violation)',
    severity: 'critical',
    details: 'EQX-2003 Heavy Excavator operating 4.2 km outside assigned Summit Mine bounds.',
    anomalyScore: 92,
    status: 'active',
    createdAt: '2026-08-05 14:20',
  },
  {
    id: 'INC-102',
    equipmentId: 'EQX-2007',
    type: 'excessive_idle',
    title: 'Excessive Engine Idle Hours',
    severity: 'medium',
    details: 'EQX-2007 Standard Crane logged 6.5h idle time with 1.2h engine runtime.',
    anomalyScore: 78,
    status: 'active',
    createdAt: '2026-08-05 11:45',
  },
  {
    id: 'INC-103',
    equipmentId: 'EQX-2012',
    type: 'unauthorized_operator',
    title: 'Unauthorized Operator Scan',
    severity: 'high',
    details: 'Operator ID OP-994 is not cleared for Heavy Duty Bulldozer EQX-2012.',
    anomalyScore: 88,
    status: 'active',
    createdAt: '2026-08-04 16:10',
  },
  {
    id: 'INC-104',
    equipmentId: 'EQX-2019',
    type: 'service_limit_exceeded',
    title: '500-Hour Service Maintenance Required',
    severity: 'warning',
    details: 'Total engine runtime reached 512.4 hrs. Hydraulic fluid service overdue.',
    anomalyScore: 65,
    status: 'active',
    createdAt: '2026-08-04 09:30',
  },
]

async function run() {
  console.log(`Seeding ${equipment.length} equipment rows...`)
  const { error: eqErr } = await supabase
    .from('equipment')
    .upsert(equipment.map(equipmentToRow), { onConflict: 'id' })
  if (eqErr) throw eqErr

  console.log(`Seeding ${usageLogs.length} usage log rows...`)
  // Chunk the insert — a few hundred rows in one request is fine, but keep
  // this safe if the dataset grows.
  const chunkSize = 500
  for (let i = 0; i < usageLogs.length; i += chunkSize) {
    const chunk = usageLogs.slice(i, i + chunkSize).map(usageLogToRow)
    const { error } = await supabase
      .from('usage_logs')
      .upsert(chunk, { onConflict: 'equipment_id,date' })
    if (error) throw error
  }

  console.log(`Seeding ${seedIncidents.length} misuse incident rows...`)
  const { error: incErr } = await supabase
    .from('misuse_incidents')
    .upsert(seedIncidents.map(incidentToRow), { onConflict: 'id' })
  if (incErr) throw incErr

  console.log('Done.')
}

run().catch((err) => {
  console.error('Seed failed:', err.message || err)
  process.exit(1)
})
