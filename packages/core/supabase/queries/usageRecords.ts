import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData } from './utils'

export type UsageRecordRow = Tables<'usage_records'>
export type UsageRecordInsert = TablesInsert<'usage_records'>

export async function recordUsage(
  client: TenetSupabaseClient,
  orgId: string,
  payload: Omit<UsageRecordInsert, 'org_id'>,
): Promise<UsageRecordRow> {
  const insertPayload: UsageRecordInsert = {
    ...payload,
    org_id: orgId,
  }

  const { data, error } = await client.from('usage_records').insert(insertPayload).select().single()

  return ensureData({ data, error })
}

export async function listUsageForOrg(
  client: TenetSupabaseClient,
  orgId: string,
  since?: string,
): Promise<UsageRecordRow[]> {
  let query = client.from('usage_records').select('*').eq('org_id', orgId)

  if (since) {
    query = query.gte('period_start', since)
  }

  const { data, error } = await query.order('period_start', { ascending: false })
  return ensureData({ data, error })
}

export async function listUsageInRange(
  client: TenetSupabaseClient,
  orgId: string,
  options: { hubId?: string; periodStart?: string; periodEnd?: string },
): Promise<UsageRecordRow[]> {
  let query = client.from('usage_records').select('*').eq('org_id', orgId)

  if (options.hubId) {
    query = query.eq('hub_id', options.hubId)
  }

  if (options.periodStart) {
    query = query.gte('period_start', options.periodStart)
  }

  if (options.periodEnd) {
    query = query.lte('period_end', options.periodEnd)
  }

  const { data, error } = await query.order('period_start', { ascending: true })
  return ensureData({ data, error })
}
