import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — see frontend/.env.example.'
  )
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

// supabase-js attaches the current session's access token to
// functions.invoke() automatically, but we pass it explicitly too so the
// call fails loudly (rather than silently unauthenticated) if that ever
// changes.
type EdgeFunctionMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function callEdgeFunction<T>(
  path: string,
  method: EdgeFunctionMethod,
  body?: object
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  const { data, error } = await supabase.functions.invoke<T>(path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  })
  if (error) throw error
  return data as T
}
