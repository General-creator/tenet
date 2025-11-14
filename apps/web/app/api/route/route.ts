import { routeTenetRequest } from '@tenet/core/routing-engine'
import { RoutingError } from '@tenet/core/routing-engine/errors'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeRoutingDecision } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'
import { metadataSchema } from '@/app/api/_lib/validation'

const routeRequestSchema = z.object({
  text: z.string().min(1),
  hubKey: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  metadata: metadataSchema,
})

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId, userId } = await getRequestContext(req)
    const body = routeRequestSchema.parse(await req.json())

    const result = await routeTenetRequest({
      supabase,
      orgId,
      userId,
      text: body.text,
      hubKey: body.hubKey ?? undefined,
      priority: body.priority,
      metadata: body.metadata ?? {},
      mode: 'route',
    })

    return jsonResponse({
      intent: result.intent,
      routing: serializeRoutingDecision(result.routingDecision),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ApiError(422, 'VALIDATION_ERROR', 'Invalid route payload.', {
          issues: error.flatten(),
        }),
      )
    }

    if (error instanceof RoutingError) {
      return handleRouteError(
        new ApiError(422, error.code, error.message, {
          details: error.details ?? {},
        }),
      )
    }

    return handleRouteError(error)
  }
}
