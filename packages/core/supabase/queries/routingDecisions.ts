import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData } from './utils'

export type RoutingDecisionRow = Tables<'routing_decisions'>
export type RoutingDecisionInsert = TablesInsert<'routing_decisions'>

export async function insertRoutingDecision(
  client: TenetSupabaseClient,
  orgId: string,
  payload: Omit<RoutingDecisionInsert, 'org_id'>,
): Promise<RoutingDecisionRow> {
  const insertPayload: RoutingDecisionInsert = {
    ...payload,
    org_id: orgId,
  }

  const { data, error } = await client
    .from('routing_decisions')
    .insert(insertPayload)
    .select()
    .single()

  return ensureData({ data, error })
}

export async function listRoutingDecisionsForRequest(
  client: TenetSupabaseClient,
  orgId: string,
  requestId: string,
): Promise<RoutingDecisionRow[]> {
  const { data, error } = await client
    .from('routing_decisions')
    .select('*')
    .eq('org_id', orgId)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })

  return ensureData({ data, error })
}
