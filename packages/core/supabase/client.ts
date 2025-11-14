import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@tenet/types'

export type TenetSupabaseClient = SupabaseClient<Database>

interface SupabaseClientOptions {
  supabaseUrl?: string
  supabaseAnonKey?: string
  accessToken?: string
}

/**
 * Creates a typed Supabase client without exposing privileged keys.
 * Callers must provide end-user JWTs through {@link SupabaseClientOptions.accessToken}
 * so that all database access continues to flow through RLS.
 */
export function createSupabaseClient(options?: SupabaseClientOptions): TenetSupabaseClient {
  const supabaseUrl = options?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = options?.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key must be configured for Tenet.')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: options?.accessToken
      ? {
          headers: {
            Authorization: `Bearer ${options.accessToken}`,
          },
        }
      : undefined,
  })
}
