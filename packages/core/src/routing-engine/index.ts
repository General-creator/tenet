import type { Json, Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../../supabase/client'
import {
  insertRoutingDecision,
  type RoutingDecisionRow,
} from '../../supabase/queries/routingDecisions'
import {
  createTenetRequest,
  type TenetRequestRow,
} from '../../supabase/queries/tenetRequests'

import { classifyIntent, type ClassifiedIntent, type IntentPriority } from './classifier'
import { selectAgent, type AgentRow } from './selectAgent'
import { resolveHub, type HubRow } from './selectHub'
import { selectModel, type ModelSelection } from './selectModel'
import { parseSopDefinition, resolveSop, type SopRow } from './selectSop'
import { recordTrace, recordUsageEstimate, type TraceStepInput } from './trace'

export type TenetRequestStatus = Tables<'tenet_requests'>['status']

export interface RouteTenetRequestInput {
  supabase: TenetSupabaseClient
  orgId: string
  userId?: string
  text: string
  hubKey?: string
  priority?: IntentPriority
  metadata?: Record<string, unknown>
  mode?: 'route' | 'execute'
}

export interface ExecutionPlan {
  agentId: string
  hubId: string
  sopId?: string
  modelName: string
  qosTier: ModelSelection['qosTier']
  steps: string[]
}

export interface RouteTenetRequestResult {
  request: TenetRequestRow
  intent: ClassifiedIntent
  hub: HubRow
  sop: SopRow | null
  agent: AgentRow
  model: ModelSelection
  routingDecision: RoutingDecisionRow
  executionPlan: ExecutionPlan
  trace: TraceStepInput[]
}

export async function routeTenetRequest(
  options: RouteTenetRequestInput,
): Promise<RouteTenetRequestResult> {
  // Safe, plain-object metadata for internal use
  const metadataRecord: Record<string, unknown> = options.metadata ?? {}

  const intent = classifyIntent({
    text: options.text,
    hubKey: options.hubKey,
    priority: options.priority,
  })

  const hub = await resolveHub({
    supabase: options.supabase,
    orgId: options.orgId,
    explicitHubKey: options.hubKey,
    intent,
    rawText: options.text,
  })

  const sop = await resolveSop({
    supabase: options.supabase,
    orgId: options.orgId,
    hubId: hub.id,
    intent,
  })
  const sopDefinition = parseSopDefinition(sop)

  const agent = await selectAgent({
    supabase: options.supabase,
    orgId: options.orgId,
    hubId: hub.id,
    sop,
    sopDefinition,
    intent,
  })

  const model = selectModel({
    text: options.text,
    priority: intent.priority,
    sopDefinition,
    intent,
  })

  const requestRow = await createTenetRequest(options.supabase, options.orgId, {
    hub_id: hub.id,
    user_id: options.userId ?? null,
    source: deriveSource(metadataRecord.source),
    raw_input: options.text,
    intent: intent.intent,
    sop_key: sop?.sop_key ?? null,
    priority: intent.priority,
    status: options.mode === 'execute' ? 'in_progress' : 'pending',
    // Cast the plain object to the DB-level Json type
    metadata: metadataRecord as Json,
  })

  const decisionPayload: Json = {
    intent: intent as unknown as Json,
    sopKey: sop?.sop_key ?? null,
    agentKey: agent.agent_key,
    reasoning: {
      hubSelection: hub.key,
      sopSelection: sop?.sop_key ?? null,
      agentSelection: agent.agent_key,
      modelSelection: model.modelName,
      qos: model.qosTier,
    },
  } as unknown as Json

  const routingDecision = await insertRoutingDecision(options.supabase, options.orgId, {
    request_id: requestRow.id,
    hub_id: hub.id,
    sop_id: sop?.id ?? null,
    agent_id: agent.id,
    model_name: model.modelName,
    qos_tier: model.qosTier,
    estimated_cost: model.estimatedCost.toString(),
    estimated_tokens: model.estimatedTokens,
    estimated_latency_ms: model.estimatedLatencyMs,
    decision_payload: decisionPayload,
  })

  const trace = buildTraceSteps({ hub, sop, agent, model, intent })

  await recordTrace({
    supabase: options.supabase,
    orgId: options.orgId,
    requestId: requestRow.id,
    routingId: routingDecision.id,
    hubId: hub.id,
    agentId: agent.id,
    sopId: sop?.id ?? null,
    trace,
  })

  if (options.mode === 'execute') {
    await recordUsageEstimate({
      supabase: options.supabase,
      orgId: options.orgId,
      hubId: hub.id,
      agentId: agent.id,
      requestId: requestRow.id,
      selection: model,
    })
  }

  return {
    request: requestRow,
    intent,
    hub,
    sop,
    agent,
    model,
    routingDecision,
    executionPlan: {
      agentId: agent.id,
      hubId: hub.id,
      sopId: sop?.id ?? undefined,
      modelName: model.modelName,
      qosTier: model.qosTier,
      steps: ['hub_resolved', 'sop_resolved', 'agent_selected', 'model_selected'],
    },
    trace,
  }
}

function deriveSource(rawSource: unknown): 'console' | 'api' | 'integration' {
  if (rawSource === 'console' || rawSource === 'api' || rawSource === 'integration') {
    return rawSource
  }

  return 'console'
}

function buildTraceSteps(options: {
  hub: HubRow
  sop: SopRow | null
  agent: AgentRow
  model: ModelSelection
  intent: ClassifiedIntent
}): TraceStepInput[] {
  const steps: TraceStepInput[] = [
    {
      stepName: 'hub_resolved',
      detail: `Hub resolved to ${options.hub.name}`,
      payload: { hubId: options.hub.id, hubKey: options.hub.key },
    },
    {
      stepName: 'intent_classified',
      detail: `Intent classified as ${options.intent.intent}`,
      payload: {
        intent: options.intent.intent,
        domain: options.intent.domain,
        sopKey: options.intent.sopKey ?? null,
        priority: options.intent.priority,
        confidence: options.intent.confidence,
      },
    },
    {
      stepName: 'sop_resolved',
      detail: options.sop ? `SOP resolved to ${options.sop.name}` : 'No SOP resolved.',
      payload: options.sop
        ? { sopId: options.sop.id, sopKey: options.sop.sop_key }
        : {},
    },
    {
      stepName: 'agent_selected',
      detail: `Agent ${options.agent.name} selected`,
      payload: { agentId: options.agent.id, agentKey: options.agent.agent_key },
    },
    {
      stepName: 'model_selected',
      detail: `Model ${options.model.modelName} selected`,
      payload: {
        modelName: options.model.modelName,
        qosTier: options.model.qosTier,
        estimatedTokens: options.model.estimatedTokens,
        estimatedCost: options.model.estimatedCost,
        estimatedLatencyMs: options.model.estimatedLatencyMs,
      },
    },
  ]

  return steps
}
