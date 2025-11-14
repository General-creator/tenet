import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { classifyIntent, metadataSchema } from '@/app/api/_lib/intent'
import { serializeRoutingDecision } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'
import { getHubByKey } from '@tenet/core/supabase/queries/hubs'
import { getSopByKey } from '@tenet/core/supabase/queries/sops'
import { createTenetRequest } from '@tenet/core/supabase/queries/tenetRequests'
import { insertRoutingDecision } from '@tenet/core/supabase/queries/routingDecisions'

const executeSchema = z.object({
  text: z.string().min(1),
  hubKey: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  metadata: metadataSchema,
})

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId, userId } = await getRequestContext(req)
    const body = executeSchema.parse(await req.json())
    const hub = body.hubKey ? await getHubByKey(supabase, orgId, body.hubKey) : null

    if (body.hubKey && !hub) {
      throw new ApiError(404, 'NOT_FOUND', `Hub ${body.hubKey} was not found for this org.`)
    }

    const intent = classifyIntent({
      text: body.text,
      hubKey: body.hubKey,
      priority: body.priority,
    })

    const sop = intent.sopKey ? await getSopByKey(supabase, orgId, intent.sopKey) : null

    const metadataRecord: Record<string, unknown> = body.metadata ?? {}
    const rawSource = metadataRecord['source']
    const source =
      rawSource === 'console' || rawSource === 'api' || rawSource === 'integration'
        ? rawSource
        : 'console'

    const requestRow = await createTenetRequest(supabase, orgId, {
      hub_id: hub?.id ?? sop?.hub_id ?? null,
      user_id: userId ?? null,
      source,
      raw_input: body.text,
      intent: intent.intent,
      sop_key: intent.sopKey ?? null,
      priority: body.priority ?? 'normal',
      status: 'completed',
      metadata: metadataRecord,
    })

    const routingDecision = await insertRoutingDecision(supabase, orgId, {
      request_id: requestRow.id,
      hub_id: hub?.id ?? sop?.hub_id ?? null,
      sop_id: sop?.id ?? null,
      agent_id: null,
      model_name: 'gpt-5.1',
      qos_tier: 'silver',
      estimated_cost: '0.0042',
      estimated_tokens: 600,
      estimated_latency_ms: 1400,
      decision_payload: { intent },
    })

    return jsonResponse({
      request: {
        id: requestRow.id,
        status: requestRow.status,
      },
      intent,
      routing: serializeRoutingDecision(routingDecision),
      result: {
        status: 'success',
        output: {
          message: 'Execution stub completed. Routing engine integration pending.',
        },
        logs: [],
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ApiError(422, 'VALIDATION_ERROR', 'Invalid execute payload.', {
          issues: error.flatten(),
        }),
      )
    }

    return handleRouteError(error)
  }
}
