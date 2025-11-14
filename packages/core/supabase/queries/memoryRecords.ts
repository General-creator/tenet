import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData } from './utils'

export type MemoryRecordRow = Tables<'memory_records'>
export type MemoryRecordInsert = TablesInsert<'memory_records'>

export async function insertMemoryRecord(
  client: TenetSupabaseClient,
  orgId: string,
  payload: Omit<MemoryRecordInsert, 'org_id'>,
): Promise<MemoryRecordRow> {
  const insertPayload: MemoryRecordInsert = {
    ...payload,
    org_id: orgId,
  }

  const { data, error } = await client
    .from('memory_records')
    .insert(insertPayload)
    .select()
    .single()

  return ensureData({ data, error })
}

export async function listMemoryRecords(
  client: TenetSupabaseClient,
  orgId: string,
  scope?: MemoryRecordRow['scope'],
  entityKey?: string,
): Promise<MemoryRecordRow[]> {
  let query = client.from('memory_records').select('*').eq('org_id', orgId)

  if (scope) {
    query = query.eq('scope', scope)
  }

  if (entityKey) {
    query = query.eq('entity_key', entityKey)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  return ensureData({ data, error })
}

export async function searchMemoryRecords(
  client: TenetSupabaseClient,
  orgId: string,
  options: { hubId?: string; query?: string },
): Promise<MemoryRecordRow[]> {
  let queryBuilder = client.from('memory_records').select('*').eq('org_id', orgId)

  if (options.hubId) {
    queryBuilder = queryBuilder.eq('hub_id', options.hubId)
  }

  if (options.query) {
    const term = `%${options.query}%`
    queryBuilder = queryBuilder.ilike('content', term)
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false }).limit(50)
  return ensureData({ data, error })
}
