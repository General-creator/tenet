import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../supabase/client'
import { getSopByKey, listSopsForOrg } from '../supabase/queries/sops'

import type { ClassifiedIntent } from './classifier'

export type SopRow = Tables<'sops'>

export interface SopDefinition {
  sopId: string
  name: string
  description?: string
  version: number
  steps: Array<{
    id: number
    type: string
    action?: string
    fields?: string[]
    rules?: string[]
    nextStepId?: number | null
    config?: Record<string, unknown>
  }>
  constraints?: {
    latencyMs?: number
    model?: string
    maxTokens?: number
  }
  metadata?: Record<string, unknown>
}

export async function resolveSop(options: {
  supabase: TenetSupabaseClient
  orgId: string
  hubId: string
  intent: ClassifiedIntent
}): Promise<SopRow | null> {
  if (options.intent.sopKey) {
    const sop = await getSopByKey(options.supabase, options.orgId, options.intent.sopKey)
    if (sop && (!sop.hub_id || sop.hub_id === options.hubId) && sop.is_active) {
      return sop
    }
  }

  const sops = await listSopsForOrg(options.supabase, options.orgId, options.hubId)
  if (sops.length === 0) {
    return null
  }

  const scored = sops
    .filter((sop) => sop.is_active)
    .map((sop) => ({
      sop,
      score: scoreSopForIntent(sop, options.intent),
    }))
    .sort((a, b) => b.score - a.score)

  return (scored[0]?.sop as SopRow | undefined) ?? null
}

function scoreSopForIntent(sop: SopRow, intent: ClassifiedIntent): number {
  let score = 0
  const sopKey = sop.sop_key.toLowerCase()
  const intentText = `${intent.intent} ${intent.domain ?? ''}`.toLowerCase()

  if (intent.sopKey && intent.sopKey === sop.sop_key) {
    score += 5
  }

  if (intentText.includes('invoice') && sopKey.includes('invoice')) {
    score += 3
  }
  if (intentText.includes('collection') && sopKey.includes('collection')) {
    score += 3
  }
  if (intentText.includes('close') && sopKey.includes('close')) {
    score += 3
  }

  return score + sop.version * 0.1
}

export function parseSopDefinition(sop: SopRow | null): SopDefinition | null {
  if (!sop || typeof sop.definition !== 'object' || sop.definition === null) {
    return null
  }

  return sop.definition as SopDefinition
}
