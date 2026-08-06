import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// `supabase` is still exported (as null) when unconfigured so imports don't
// crash the module graph — callers check isSupabaseConfigured first.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
