import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData, ensureMaybeSingle } from './utils'

export type HubRow = Tables<'hubs'>

export async function listHubsForOrg(
  client: TenetSupabaseClient,
  orgId: string,
): Promise<HubRow[]> {
  const { data, error } = await client
    .from('hubs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  return ensureData({ data, error })
}

export async function getHubByKey(
  client: TenetSupabaseClient,
  orgId: string,
  hubKey: string,
): Promise<HubRow | null> {
  const { data, error } = await client
    .from('hubs')
    .select('*')
    .eq('org_id', orgId)
    .eq('key', hubKey)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}
