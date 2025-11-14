import { getHubByKey } from '@tenet/core/supabase/queries/hubs'
import { createSop, listSopsForOrg } from '@tenet/core/supabase/queries/sops'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeSop } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'

const createSopSchema = z.object({
  hubKey: z.string().optional(),
  sopKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.number().int().positive().optional(),
  definition: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const hubKey = req.nextUrl.searchParams.get('hubKey') ?? undefined
    const search = req.nextUrl.searchParams.get('search') ?? undefined
    const hub = hubKey ? await getHubByKey(supabase, orgId, hubKey) : null

    if (hubKey && !hub) {
      throw new ApiError(404, 'NOT_FOUND', `Hub ${hubKey} not found.`)
    }

    const sops = await listSopsForOrg(supabase, orgId, hub?.id)
    const filtered = search
      ? sops.filter((sop) =>
          [sop.name, sop.description ?? ''].some((field) =>
            field.toLowerCase().includes(search.toLowerCase()),
          ),
        )
      : sops

    return jsonResponse({
      sops: filtered.map(serializeSop),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId, userId } = await getRequestContext(req)
    const body = createSopSchema.parse(await req.json())
    const hub = body.hubKey ? await getHubByKey(supabase, orgId, body.hubKey) : null

    if (body.hubKey && !hub) {
      throw new ApiError(404, 'NOT_FOUND', `Hub ${body.hubKey} not found.`)
    }

    const created = await createSop(supabase, orgId, {
      hub_id: hub?.id ?? null,
      sop_key: body.sopKey,
      name: body.name,
      description: body.description ?? null,
      version: body.version ?? 1,
      is_active: body.isActive ?? true,
      definition: body.definition,
      created_by: userId ?? null,
    })

    return jsonResponse({ sop: serializeSop(created) }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ApiError(422, 'VALIDATION_ERROR', 'Invalid SOP payload.', {
          issues: error.flatten(),
        }),
      )
    }

    return handleRouteError(error)
  }
}
