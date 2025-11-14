import { z } from 'zod'

export interface ClassifiedIntent {
  intent: string
  domain?: string
  sopKey?: string
  priority: 'low' | 'normal' | 'high'
  confidence: number
}

const financeKeywords = [/invoice/i, /collection/i, /close/i]

export function classifyIntent(input: {
  text: string
  hubKey?: string
  priority?: 'low' | 'normal' | 'high'
}): ClassifiedIntent {
  const basePriority = input.priority ?? 'normal'
  const normalizedText = input.text.trim()
  const candidateHub = input.hubKey ?? (financeKeywords.some((regex) => regex.test(normalizedText)) ? 'finance' : undefined)

  if (/invoice/i.test(normalizedText)) {
    return {
      intent: 'process_invoice',
      domain: candidateHub ?? 'finance',
      sopKey: 'finance.ap.invoice_v1',
      priority: basePriority,
      confidence: 0.82,
    }
  }

  if (/collection/i.test(normalizedText)) {
    return {
      intent: 'collections_follow_up',
      domain: candidateHub ?? 'finance',
      sopKey: 'finance.ar.collection_v1',
      priority: basePriority,
      confidence: 0.78,
    }
  }

  if (/close/i.test(normalizedText)) {
    return {
      intent: 'close_month',
      domain: candidateHub ?? 'finance',
      sopKey: 'finance.mec.close_month_v1',
      priority: basePriority,
      confidence: 0.75,
    }
  }

  return {
    intent: 'general_inquiry',
    domain: candidateHub,
    sopKey: undefined,
    priority: basePriority,
    confidence: 0.5,
  }
}

export const metadataSchema = z.record(z.string(), z.unknown()).optional()
