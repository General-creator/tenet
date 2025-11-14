import type { Tables } from '@tenet/types'

import type { ClassifiedIntent } from './intent'

type TenetRequestRow = Tables<'tenet_requests'>
type RoutingDecisionRow = Tables<'routing_decisions'>
type ExecutionLogRow = Tables<'execution_logs'>
type SopRow = Tables<'sops'>
type AgentRow = Tables<'agents'>
type HubRow = Tables<'hubs'>
type GraphNodeRow = Tables<'graph_nodes'>
type GraphEdgeRow = Tables<'graph_edges'>
type MemoryRecordRow = Tables<'memory_records'>

export function serializeRequest(row: TenetRequestRow) {
  return {
    id: row.id,
    hubId: row.hub_id ?? undefined,
    userId: row.user_id ?? undefined,
    rawInput: row.raw_input,
    intent: row.intent ?? undefined,
    sopKey: row.sop_key ?? undefined,
    priority: row.priority,
    status: row.status,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function serializeRoutingDecision(row: RoutingDecisionRow | null | undefined) {
  if (!row) {
    return undefined
  }

  return {
    id: row.id,
    requestId: row.request_id,
    hubId: row.hub_id ?? undefined,
    sopId: row.sop_id ?? undefined,
    agentId: row.agent_id ?? undefined,
    modelName: row.model_name ?? undefined,
    qosTier: row.qos_tier ?? undefined,
    estimatedCost: row.estimated_cost ? Number(row.estimated_cost) : undefined,
    estimatedTokens: row.estimated_tokens ?? undefined,
    estimatedLatencyMs: row.estimated_latency_ms ?? undefined,
    decisionPayload: row.decision_payload ?? {},
    createdAt: row.created_at,
  }
}

export function serializeLogs(logs: ExecutionLogRow[]) {
  return logs.map((log) => ({
    id: log.id,
    stepName: log.step_name ?? undefined,
    status: log.status,
    detail: log.detail ?? undefined,
    payload: log.payload ?? {},
    tokensUsed: log.tokens_used ?? undefined,
    latencyMs: log.latency_ms ?? undefined,
    timestamp: log.created_at,
  }))
}

export function serializeSop(row: SopRow) {
  return {
    id: row.id,
    hubId: row.hub_id ?? undefined,
    sopKey: row.sop_key,
    name: row.name,
    description: row.description ?? undefined,
    version: row.version,
    isActive: row.is_active,
    definition: row.definition,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function serializeAgent(row: AgentRow) {
  return {
    id: row.id,
    hubId: row.hub_id ?? undefined,
    agentKey: row.agent_key,
    name: row.name,
    description: row.description ?? undefined,
    specialization: row.specialization ?? undefined,
    skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
    memoryProfile: row.memory_profile ?? undefined,
    maxTokens: row.max_tokens ?? undefined,
    config: row.config ?? {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function serializeHub(row: HubRow) {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function serializeGraphNode(row: GraphNodeRow) {
  return {
    id: row.id,
    hubId: row.hub_id ?? undefined,
    nodeKey: row.node_key,
    nodeType: row.node_type,
    label: row.label ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function serializeGraphEdges(edges: GraphEdgeRow[]) {
  return edges.map((edge) => ({
    id: edge.id,
    fromNodeId: edge.from_node_id,
    toNodeId: edge.to_node_id,
    relationType: edge.relation_type,
    weight: edge.weight ? Number(edge.weight) : undefined,
    metadata: edge.metadata ?? {},
    createdAt: edge.created_at,
  }))
}

export function serializeMemoryRecord(row: MemoryRecordRow) {
  return {
    id: row.id,
    hubId: row.hub_id ?? undefined,
    agentId: row.agent_id ?? undefined,
    sopId: row.sop_id ?? undefined,
    userId: row.user_id ?? undefined,
    scope: row.scope,
    entityKey: row.entity_key ?? undefined,
    content: row.content,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }
}

export function buildRoutingStub(intent: ClassifiedIntent, overrides?: Partial<ReturnType<typeof serializeRoutingDecision>>) {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    requestId: overrides?.requestId ?? crypto.randomUUID(),
    hubId: overrides?.hubId,
    sopId: overrides?.sopId,
    agentId: overrides?.agentId,
    modelName: overrides?.modelName ?? 'gpt-5.1',
    qosTier: overrides?.qosTier ?? 'silver',
    estimatedCost: overrides?.estimatedCost ?? 0.004,
    estimatedTokens: overrides?.estimatedTokens ?? 600,
    estimatedLatencyMs: overrides?.estimatedLatencyMs ?? 1200,
    decisionPayload: {
      intent,
      ...(overrides?.decisionPayload ?? {}),
    },
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
  }
}
