import type { PostgrestError } from '@supabase/supabase-js'

export function ensureData<T>({ data, error }: { data: T; error: PostgrestError | null }): T {
  if (error) {
    throw error
  }

  return data
}

export function ensureMaybeSingle<T>({
  data,
  error,
}: {
  data: T | null
  error: PostgrestError | null
}): T | null {
  if (error) {
    throw error
  }

  return data
}
