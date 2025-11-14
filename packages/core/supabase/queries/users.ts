import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'

import { ensureData, ensureMaybeSingle } from './utils'

export type UserRow = Tables<'users'>

export async function getUserById(
  client: TenetSupabaseClient,
  orgId: string,
  userId: string,
): Promise<UserRow | null> {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', userId)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}

export async function getUserByEmail(
  client: TenetSupabaseClient,
  orgId: string,
  email: string,
): Promise<UserRow | null> {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .eq('email', email)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}

export async function listUsersForOrg(
  client: TenetSupabaseClient,
  orgId: string,
): Promise<UserRow[]> {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  return ensureData({ data, error })
}
