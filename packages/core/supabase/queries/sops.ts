import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureData, ensureMaybeSingle } from './utils'

export type SopRow = Tables<'sops'>

export async function listSopsForOrg(
  client: TenetSupabaseClient,
  orgId: string,
  hubId?: string,
): Promise<SopRow[]> {
  let query = client.from('sops').select('*').eq('org_id', orgId)

  if (hubId) {
    query = query.eq('hub_id', hubId)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })
  return ensureData({ data, error })
}

export async function getSopByKey(
  client: TenetSupabaseClient,
  orgId: string,
  sopKey: string,
  version?: number,
): Promise<SopRow | null> {
  let query = client.from('sops').select('*').eq('org_id', orgId).eq('sop_key', sopKey)
  if (version) {
    query = query.eq('version', version)
  } else {
    query = query.order('version', { ascending: false }).limit(1)
  }

  const { data, error } = await query.maybeSingle()
  return ensureMaybeSingle({ data, error })
}
