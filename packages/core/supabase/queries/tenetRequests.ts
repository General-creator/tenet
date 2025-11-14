import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData, ensureMaybeSingle } from './utils'

export type TenetRequestRow = Tables<'tenet_requests'>
export type TenetRequestInsert = TablesInsert<'tenet_requests'>

export async function createTenetRequest(
  client: TenetSupabaseClient,
  orgId: string,
  payload: Omit<TenetRequestInsert, 'org_id'>,
): Promise<TenetRequestRow> {
  const insertPayload: TenetRequestInsert = {
    ...payload,
    org_id: orgId,
  }

  const { data, error } = await client
    .from('tenet_requests')
    .insert(insertPayload)
    .select()
    .single()

  return ensureData({ data, error })
}

export async function getTenetRequestById(
  client: TenetSupabaseClient,
  orgId: string,
  requestId: string,
): Promise<TenetRequestRow | null> {
  const { data, error } = await client
    .from('tenet_requests')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', requestId)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}

export async function listRecentRequests(
  client: TenetSupabaseClient,
  orgId: string,
  limit = 20,
): Promise<TenetRequestRow[]> {
  const { data, error } = await client
    .from('tenet_requests')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return ensureData({ data, error })
}
