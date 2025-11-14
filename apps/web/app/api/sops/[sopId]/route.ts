import { getSopById, updateSop } from '@tenet/core/supabase/queries/sops'
import type { SopUpdate } from '@tenet/core/supabase/queries/sops'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeSop } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    definition: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  })

interface RouteParams {
  params: {
    sopId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const sop = await getSopById(supabase, orgId, params.sopId)

    if (!sop) {
      throw new ApiError(404, 'NOT_FOUND', 'SOP not found for this org.')
    }

    return jsonResponse({ sop: serializeSop(sop) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const body = updateSchema.parse(await req.json())

    const existing = await getSopById(supabase, orgId, params.sopId)
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'SOP not found for this org.')
    }

    const changes: Partial<SopUpdate> = {}
    if (body.name !== undefined) {
      changes.name = body.name
    }
    if (body.description !== undefined) {
      changes.description = body.description
    }
    if (body.isActive !== undefined) {
      changes.is_active = body.isActive
    }
    if (body.definition !== undefined) {
      changes.definition = body.definition
    }

    const updated = await updateSop(supabase, orgId, params.sopId, changes)

    return jsonResponse({ sop: serializeSop(updated) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ApiError(422, 'VALIDATION_ERROR', 'Invalid SOP update payload.', {
          issues: error.flatten(),
        }),
      )
    }

    return handleRouteError(error)
  }
}
