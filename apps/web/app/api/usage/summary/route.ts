import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { jsonResponse } from '@/app/api/_lib/responses'
import { getHubByKey } from '@tenet/core/supabase/queries/hubs'
import { listUsageInRange } from '@tenet/core/supabase/queries/usageRecords'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const hubKey = req.nextUrl.searchParams.get('hubKey') ?? undefined
    const periodStart = req.nextUrl.searchParams.get('periodStart') ?? undefined
    const periodEnd = req.nextUrl.searchParams.get('periodEnd') ?? undefined

    const hub = hubKey ? await getHubByKey(supabase, orgId, hubKey) : null
    if (hubKey && !hub) {
      throw new ApiError(404, 'NOT_FOUND', `Hub ${hubKey} not found.`)
    }

    const usage = await listUsageInRange(supabase, orgId, {
      hubId: hub?.id,
      periodStart: periodStart ?? undefined,
      periodEnd: periodEnd ?? undefined,
    })

    const summary = usage.reduce(
      (acc, record) => {
        const tokens = record.tokens_total ?? 0
        const cost = record.cost ? Number(record.cost) : 0
        acc.totalTokens += tokens
        acc.totalCost += cost

        if (record.model_name) {
          acc.byModel[record.model_name] = acc.byModel[record.model_name] ?? { tokens: 0, cost: 0 }
          acc.byModel[record.model_name].tokens += tokens
          acc.byModel[record.model_name].cost += cost
        }

        if (record.agent_id) {
          acc.byAgent[record.agent_id] = acc.byAgent[record.agent_id] ?? 0
          acc.byAgent[record.agent_id] += tokens
        }

        return acc
      },
      {
        totalTokens: 0,
        totalCost: 0,
        byModel: {} as Record<string, { tokens: number; cost: number }>,
        byAgent: {} as Record<string, number>,
      },
    )

    return jsonResponse({
      orgId,
      hubKey: hubKey ?? null,
      periodStart: periodStart ?? null,
      periodEnd: periodEnd ?? null,
      totalTokens: summary.totalTokens,
      totalCost: Number(summary.totalCost.toFixed(4)),
      byModel: Object.entries(summary.byModel).map(([modelName, stats]) => ({
        modelName,
        tokens: stats.tokens,
        cost: Number(stats.cost.toFixed(4)),
      })),
      byAgent: Object.entries(summary.byAgent).map(([agentId, tokens]) => ({
        agentId,
        tokens,
      })),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
