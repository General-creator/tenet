export type IntentPriority = 'low' | 'normal' | 'high'

export interface ClassifiedIntent {
  intent: string
  domain?: string
  sopKey?: string
  priority: IntentPriority
  confidence: number
}

const keywordMappings: Array<{ pattern: RegExp; intent: string; domain: string; sopKey: string }> = [
  {
    pattern: /invoice/i,
    intent: 'process_invoice',
    domain: 'finance',
    sopKey: 'finance.ap.invoice_v1',
  },
  {
    pattern: /collection|overdue/i,
    intent: 'collections_follow_up',
    domain: 'finance',
    sopKey: 'finance.ar.collection_v1',
  },
  {
    pattern: /month[-\s]?end|close/i,
    intent: 'close_month',
    domain: 'finance',
    sopKey: 'finance.mec.close_month_v1',
  },
]

const fallbackIntent: ClassifiedIntent = {
  intent: 'general_inquiry',
  domain: undefined,
  sopKey: undefined,
  priority: 'normal',
  confidence: 0.5,
}

export function classifyIntent(input: {
  text: string
  hubKey?: string
  priority?: IntentPriority
}): ClassifiedIntent {
  const priority = input.priority ?? 'normal'
  const normalized = input.text.trim()

  for (const mapping of keywordMappings) {
    if (mapping.pattern.test(normalized)) {
      return {
        intent: mapping.intent,
        domain: input.hubKey ?? mapping.domain,
        sopKey: mapping.sopKey,
        priority,
        confidence: 0.78,
      }
    }
  }

  if (input.hubKey) {
    return {
      ...fallbackIntent,
      priority,
      domain: input.hubKey,
    }
  }

  return {
    ...fallbackIntent,
    priority,
  }
}
