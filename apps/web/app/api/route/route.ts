import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { buildRoutingStub, serializeRoutingDecision } from '@/app/api/_lib/mappers'
import { classifyIntent, metadataSchema } from '@/app/api/_lib/intent'
import { jsonResponse } from '@/app/api/_lib/responses'

const routeRequestSchema = z.object({
  text: z.string().min(1),
  hubKey: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  metadata: metadataSchema,
})

export async function POST(req: NextRequest): Promise<Response> {
  try {
    await getRequestContext(req)
    const body = routeRequestSchema.parse(await req.json())

    const intent = classifyIntent({
      text: body.text,
      hubKey: body.hubKey,
      priority: body.priority,
    })

    const routing = buildRoutingStub(intent)

    return jsonResponse({
      intent,
      routing,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ApiError(422, 'VALIDATION_ERROR', 'Invalid route payload.', {
          issues: error.flatten(),
        }),
      )
    }

    return handleRouteError(error)
  }
}
