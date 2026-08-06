// One-off DDL runner: connects directly to Postgres (not through the REST
// API, which can't run CREATE TABLE) and executes a .sql file.
//
// Usage: npm run apply-schema [path/to/file.sql]   (defaults to supabase/schema.sql)
// Requires SUPABASE_DB_PASSWORD and VITE_SUPABASE_URL in .env.local.

import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

const projectUrl = process.env.VITE_SUPABASE_URL
const password = process.env.SUPABASE_DB_PASSWORD
const sqlPath = process.argv[2] || 'supabase/schema.sql'

if (!projectUrl || !password) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.local')
  process.exit(1)
}

const projectRef = new URL(projectUrl).hostname.split('.')[0]
const sql = await readFile(sqlPath, 'utf8')

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log(`Connected. Running ${sqlPath} ...`)
  await client.query(sql)
  console.log('Schema applied successfully.')
} catch (err) {
  console.error('Failed to apply schema:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
