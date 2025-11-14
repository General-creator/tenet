import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData, ensureMaybeSingle } from './utils'

export type AgentRow = Tables<'agents'>

export async function listAgentsForHub(
  client: TenetSupabaseClient,
  orgId: string,
  hubId: string,
): Promise<AgentRow[]> {
  const { data, error } = await client
    .from('agents')
    .select('*')
    .eq('org_id', orgId)
    .eq('hub_id', hubId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return ensureData({ data, error })
}

export async function getAgentByKey(
  client: TenetSupabaseClient,
  orgId: string,
  agentKey: string,
): Promise<AgentRow | null> {
  const { data, error } = await client
    .from('agents')
    .select('*')
    .eq('org_id', orgId)
    .eq('agent_key', agentKey)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}
