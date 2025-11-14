import type { ClassifiedIntent, IntentPriority } from './classifier'
import type { SopDefinition } from './selectSop'

export type QoSTier = 'bronze' | 'silver' | 'gold'

export interface ModelSelection {
  modelName: string
  qosTier: QoSTier
  estimatedTokens: number
  estimatedCost: number
  estimatedLatencyMs: number
}

interface ModelConfig {
  name: string
  costPerToken: number
  latencyMs: number
  maxTokens: number
}

const MODEL_CONFIGS: ModelConfig[] = [
  { name: 'gpt-5.1', costPerToken: 0.00002, latencyMs: 1400, maxTokens: 32000 },
  { name: 'gpt-5.1-mini', costPerToken: 0.00001, latencyMs: 800, maxTokens: 16000 },
  { name: 'gpt-4.1', costPerToken: 0.000015, latencyMs: 1100, maxTokens: 24000 },
  { name: 'claude-3.5-sonnet', costPerToken: 0.000018, latencyMs: 1500, maxTokens: 20000 },
]

const PRIORITY_TO_QOS: Record<IntentPriority, QoSTier> = {
  high: 'gold',
  normal: 'silver',
  low: 'bronze',
}

export function selectModel(options: {
  text: string
  priority: IntentPriority
  sopDefinition: SopDefinition | null
  intent: ClassifiedIntent
}): ModelSelection {
  const qosTier = PRIORITY_TO_QOS[options.priority]
  const estimatedTokens = estimateTokens(options.text, options.sopDefinition)
  const preferredModelName = options.sopDefinition?.constraints?.model

  const candidateOrder = buildCandidateList(preferredModelName, qosTier)
  const selected = candidateOrder.find((config) => config.maxTokens > estimatedTokens)
  const modelConfig = selected ?? MODEL_CONFIGS[0]

  const estimatedCost = Number((estimatedTokens * modelConfig.costPerToken).toFixed(6))

  return {
    modelName: modelConfig.name,
    qosTier,
    estimatedTokens,
    estimatedCost,
    estimatedLatencyMs: modelConfig.latencyMs,
  }
}

function estimateTokens(text: string, sop: SopDefinition | null): number {
  const words = text.trim().split(/\s+/).length
  const baseTokens = Math.max(words * 3, 100)
  const sopTokens = sop?.steps?.length ? sop.steps.length * 120 : 200
  const constraintMax = sop?.constraints?.maxTokens ?? Number.MAX_SAFE_INTEGER
  return Math.min(baseTokens + sopTokens, constraintMax)
}

function buildCandidateList(preferred: string | undefined, qos: QoSTier): ModelConfig[] {
  if (preferred) {
    const preferredConfig = MODEL_CONFIGS.find((config) => config.name === preferred)
    if (preferredConfig) {
      return [preferredConfig, ...MODEL_CONFIGS.filter((config) => config.name !== preferredConfig.name)]
    }
  }

  if (qos === 'bronze') {
    return MODEL_CONFIGS.sort((a, b) => a.costPerToken - b.costPerToken)
  }

  if (qos === 'gold') {
    return MODEL_CONFIGS.sort((a, b) => a.latencyMs - b.latencyMs)
  }

  return MODEL_CONFIGS
}
