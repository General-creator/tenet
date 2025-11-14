import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../supabase/client'
import { listAgentsForHub } from '../supabase/queries/agents'

import type { ClassifiedIntent } from './classifier'
import { RoutingError } from './errors'
import type { SopDefinition, SopRow } from './selectSop'

export type AgentRow = Tables<'agents'>

export async function selectAgent(options: {
  supabase: TenetSupabaseClient
  orgId: string
  hubId: string
  sop: SopRow | null
  sopDefinition: SopDefinition | null
  intent: ClassifiedIntent
}): Promise<AgentRow> {
  const agents = await listAgentsForHub(options.supabase, options.orgId, options.hubId)
  if (agents.length === 0) {
    throw new RoutingError('NO_AGENT_AVAILABLE', 'No agents are configured for this hub.')
  }

  const scored = agents
    .map((agent) => ({
      agent,
      score: scoreAgent(agent, options.intent, options.sopDefinition),
    }))
    .sort((a, b) => b.score - a.score)

  const top = scored[0]
  if (!top || top.score <= 0) {
    return agents[0]
  }

  return top.agent
}

function scoreAgent(agent: AgentRow, intent: ClassifiedIntent, sop?: SopDefinition | null): number {
  let score = 0
  const lowerIntent = intent.intent.toLowerCase()

  if (agent.specialization) {
    const specialization = agent.specialization.toLowerCase()
    if (lowerIntent.includes('invoice') && specialization.includes('payable')) {
      score += 4
    }
    if (lowerIntent.includes('collection') && specialization.includes('receivable')) {
      score += 4
    }
    if (lowerIntent.includes('close') && specialization.includes('month_end')) {
      score += 4
    }
  }

  if (typeof agent.skills === 'object' && Array.isArray(agent.skills)) {
    const skills = (agent.skills as string[]).map((skill) => skill.toLowerCase())
    if (lowerIntent.includes('invoice')) {
      if (skills.includes('extract_invoice_fields')) score += 2
      if (skills.includes('validate_invoice')) score += 2
    }
    if (lowerIntent.includes('collection') && skills.includes('generate_collection_email')) {
      score += 3
    }
  }

  if (sop?.sopId && agent.agent_key.includes(sop.sopId.split('.').pop() ?? '')) {
    score += 2
  }

  return score
}
