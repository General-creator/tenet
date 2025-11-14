export interface Hub {
  id: string
  key: string
  name: string
  description?: string
}

export interface RequestSummary {
  id: string
  hubId?: string
  userId?: string
  rawInput: string
  intent?: string
  sopKey?: string
  priority: 'low' | 'normal' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface RoutingDecision {
  id: string
  requestId: string
  hubId?: string
  sopId?: string
  agentId?: string
  modelName?: string
  qosTier?: 'bronze' | 'silver' | 'gold'
  estimatedCost?: number
  estimatedTokens?: number
  estimatedLatencyMs?: number
  decisionPayload: Record<string, unknown>
  createdAt: string
}

export interface RequestDetailResponse {
  request: RequestSummary
  routing?: RoutingDecision
  result?: {
    status: 'success' | 'partial' | 'failed'
    output: unknown
  }
  logs?: ExecutionLog[]
}

export interface ExecutionLog {
  id: string
  stepName?: string
  status: 'started' | 'success' | 'error'
  detail?: string
  payload: Record<string, unknown>
  tokensUsed?: number
  latencyMs?: number
  timestamp: string
}

export interface Sop {
  id: string
  hubId?: string
  sopKey: string
  name: string
  description?: string
  version: number
  isActive: boolean
  definition: Record<string, unknown>
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface Agent {
  id: string
  hubId?: string
  agentKey: string
  name: string
  description?: string
  specialization?: string
  skills: string[]
  memoryProfile?: string
  maxTokens?: number
  config: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GraphNode {
  id: string
  hubId?: string
  nodeKey: string
  nodeType: string
  label?: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MemoryRecord {
  id: string
  hubId?: string
  agentId?: string
  sopId?: string
  userId?: string
  scope: 'org' | 'hub' | 'agent' | 'user'
  entityKey?: string
  content: string
  metadata: Record<string, unknown>
  createdAt: string
}
