import { createClient } from "@supabase/supabase-js"

let _supabaseClient

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  _supabaseClient = createClient(url, anonKey)
  return _supabaseClient
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseClient()
      return client[prop]
    },
  }
)

