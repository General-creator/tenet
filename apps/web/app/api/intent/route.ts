import { classifyIntent } from '@tenet/core/routing-engine/classifier'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { jsonResponse } from '@/app/api/_lib/responses'
import { metadataSchema } from '@/app/api/_lib/validation'

const intentRequestSchema = z.object({
  text: z.string().min(1, 'text is required'),
  hubKey: z.string().optional(),
  metadata: metadataSchema,
})

export async function POST(req: NextRequest): Promise<Response> {
  try {
    await getRequestContext(req)
    const body = intentRequestSchema.parse(await req.json())

    const intent = classifyIntent({
      text: body.text,
      hubKey: body.hubKey,
    })

    return jsonResponse({ intent })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ApiError(422, 'VALIDATION_ERROR', 'Invalid intent payload.', {
          issues: error.flatten(),
        }),
      )
    }

    return handleRouteError(error)
  }
}
