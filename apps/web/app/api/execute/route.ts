import { routeTenetRequest } from '@tenet/core/routing-engine'
import { RoutingError } from '@tenet/core/routing-engine/errors'
import { updateTenetRequestStatus } from '@tenet/core/supabase/queries/tenetRequests'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeRoutingDecision } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'
import { metadataSchema } from '@/app/api/_lib/validation'

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

    const routingResult = await routeTenetRequest({
      supabase,
      orgId,
      userId,
      text: body.text,
      hubKey: body.hubKey ?? undefined,
      priority: body.priority,
      metadata: body.metadata ?? {},
      mode: 'execute',
    })

    const completedRequest = await updateTenetRequestStatus(
      supabase,
      orgId,
      routingResult.request.id,
      'completed',
    )

    return jsonResponse({
      request: {
        id: completedRequest.id,
        status: completedRequest.status,
      },
      intent: routingResult.intent,
      routing: serializeRoutingDecision(routingResult.routingDecision),
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
