import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'

import { ensureData } from './utils'

export type GraphEdgeRow = Tables<'graph_edges'>
export type GraphEdgeInsert = TablesInsert<'graph_edges'>

export async function upsertGraphEdge(
  client: TenetSupabaseClient,
  orgId: string,
  payload: Omit<GraphEdgeInsert, 'org_id'>,
): Promise<GraphEdgeRow> {
  const insertPayload: GraphEdgeInsert = {
    ...payload,
    org_id: orgId,
  }

  const { data, error } = await client
    .from('graph_edges')
    .upsert(insertPayload, { onConflict: 'org_id,from_node_id,to_node_id,relation_type' })
    .select()
    .single()

  return ensureData({ data, error })
}

export async function listGraphEdges(
  client: TenetSupabaseClient,
  orgId: string,
): Promise<GraphEdgeRow[]> {
  const { data, error } = await client.from('graph_edges').select('*').eq('org_id', orgId)
  return ensureData({ data, error })
}

export async function listEdgesForNode(
  client: TenetSupabaseClient,
  orgId: string,
  nodeId: string,
): Promise<GraphEdgeRow[]> {
  const { data, error } = await client
    .from('graph_edges')
    .select('*')
    .eq('org_id', orgId)
    .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`)

  return ensureData({ data, error })
}
