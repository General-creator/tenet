import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData } from './utils'

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
  nodeType?: string,
): Promise<GraphNodeRow[]> {
  let query = client.from('graph_nodes').select('*').eq('org_id', orgId)

  if (nodeType) {
    query = query.eq('node_type', nodeType)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })
  return ensureData({ data, error })
}
