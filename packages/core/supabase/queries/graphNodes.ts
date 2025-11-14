import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'

import { ensureData, ensureMaybeSingle } from './utils'

export type GraphNodeRow = Tables<'graph_nodes'>
export type GraphNodeInsert = TablesInsert<'graph_nodes'>

export async function upsertGraphNode(
  client: TenetSupabaseClient,
  orgId: string,
  payload: Omit<GraphNodeInsert, 'org_id'>,
): Promise<GraphNodeRow> {
  const insertPayload: GraphNodeInsert = {
    ...payload,
    org_id: orgId,
  }

  const { data, error } = await client
    .from('graph_nodes')
    .upsert(insertPayload, { onConflict: 'org_id,node_key' })
    .select()
    .single()

  return ensureData({ data, error })
}

export async function listGraphNodes(
  client: TenetSupabaseClient,
  orgId: string,
  options?: { nodeType?: string; hubId?: string },
): Promise<GraphNodeRow[]> {
  let query = client.from('graph_nodes').select('*').eq('org_id', orgId)

  if (options?.nodeType) {
    query = query.eq('node_type', options.nodeType)
  }

  if (options?.hubId) {
    query = query.eq('hub_id', options.hubId)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })
  return ensureData({ data, error })
}

export async function getGraphNodeById(
  client: TenetSupabaseClient,
  orgId: string,
  nodeId: string,
): Promise<GraphNodeRow | null> {
  const { data, error } = await client
    .from('graph_nodes')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', nodeId)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}

export async function getGraphNodesByIds(
  client: TenetSupabaseClient,
  orgId: string,
  nodeIds: string[],
): Promise<GraphNodeRow[]> {
  if (nodeIds.length === 0) {
    return []
  }

  const { data, error } = await client
    .from('graph_nodes')
    .select('*')
    .eq('org_id', orgId)
    .in('id', nodeIds)

  return ensureData({ data, error })
}
