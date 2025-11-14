import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../supabase/client'
import { getHubByKey, listHubsForOrg } from '../supabase/queries/hubs'

import type { ClassifiedIntent } from './classifier'
import { RoutingError } from './errors'

export type HubRow = Tables<'hubs'>

const hubKeywordMap: Record<string, RegExp[]> = {
  finance: [/invoice/i, /collection/i, /close/i, /payable/i, /ar\b/i],
  growth: [/campaign/i, /lead/i, /mql/i, /growth/i],
  people: [/onboard/i, /recruit/i, /people/i, /hr/i],
  ops: [/logistics/i, /ops/i, /supply/i],
}

export async function resolveHub(options: {
  supabase: TenetSupabaseClient
  orgId: string
  explicitHubKey?: string
  intent: ClassifiedIntent
  rawText: string
}): Promise<HubRow> {
  if (options.explicitHubKey) {
    const hub = await getHubByKey(options.supabase, options.orgId, options.explicitHubKey)
    if (hub) {
      return hub
    }
    throw new RoutingError('NO_HUB_RESOLVED', `Hub ${options.explicitHubKey} does not exist.`)
  }

  const hubs = await listHubsForOrg(options.supabase, options.orgId)

  if (options.intent.domain) {
    const domainHub = hubs.find((hub) => hub.key === options.intent.domain)
    if (domainHub) {
      return domainHub
    }
  }

  for (const hub of hubs) {
    const patterns = hubKeywordMap[hub.key]
    if (patterns && patterns.some((regex) => regex.test(options.rawText))) {
      return hub
    }
  }

  if (hubs.length > 0) {
    return hubs[0]
  }

  throw new RoutingError('NO_HUB_RESOLVED', 'No hubs are configured for this organization.')
}
