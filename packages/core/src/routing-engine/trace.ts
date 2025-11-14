import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../supabase/client'
import { insertExecutionLogs } from '../supabase/queries/executionLogs'
import { recordUsage } from '../supabase/queries/usageRecords'

import type { ModelSelection } from './selectModel'

export type ExecutionLogRow = Tables<'execution_logs'>

export interface TraceStepInput {
  stepName: string
  detail: string
  payload?: Record<string, unknown>
}

export async function recordTrace(options: {
  supabase: TenetSupabaseClient
  orgId: string
  requestId: string
  routingId: string
  hubId?: string | null
  agentId?: string | null
  sopId?: string | null
  trace: TraceStepInput[]
}): Promise<void> {
  if (options.trace.length === 0) {
    return
  }

  await insertExecutionLogs(
    options.supabase,
    options.orgId,
    options.trace.map((step) => ({
      request_id: options.requestId,
      routing_id: options.routingId,
      hub_id: options.hubId ?? null,
      agent_id: options.agentId ?? null,
      sop_id: options.sopId ?? null,
      step_name: step.stepName,
      status: 'success',
      detail: step.detail,
      payload: step.payload ?? {},
      tokens_used: null,
      latency_ms: null,
    })),
  )
}

export async function recordUsageEstimate(options: {
  supabase: TenetSupabaseClient
  orgId: string
  hubId?: string | null
  agentId?: string | null
  requestId: string
  selection: ModelSelection
}): Promise<void> {
  await recordUsage(options.supabase, options.orgId, {
    hub_id: options.hubId ?? null,
    user_id: null,
    request_id: options.requestId,
    agent_id: options.agentId ?? null,
    model_name: options.selection.modelName,
    qos_tier: options.selection.qosTier,
    tokens_prompt: options.selection.estimatedTokens,
    tokens_completion: 0,
    tokens_total: options.selection.estimatedTokens,
    cost: options.selection.estimatedCost.toString(),
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
  })
}
