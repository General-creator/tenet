import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeAgent } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'
import { getHubByKey } from '@tenet/core/supabase/queries/hubs'
import { createAgent, listAgentsForHub, listAgentsForOrg } from '@tenet/core/supabase/queries/agents'

const createAgentSchema = z.object({
  hubKey: z.string().min(1),
  agentKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  specialization: z.string().optional(),
  skills: z.array(z.string()).optional(),
  memoryProfile: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const hubKey = req.nextUrl.searchParams.get('hubKey') ?? undefined
    let agents

    if (hubKey) {
      const hub = await getHubByKey(supabase, orgId, hubKey)
      if (!hub) {
        throw new ApiError(404, 'NOT_FOUND', `Hub ${hubKey} not found.`)
      }
      agents = await listAgentsForHub(supabase, orgId, hub.id)
    } else {
      agents = await listAgentsForOrg(supabase, orgId)
    }

    return jsonResponse({ agents: agents.map(serializeAgent) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const body = createAgentSchema.parse(await req.json())
    const hub = await getHubByKey(supabase, orgId, body.hubKey)

    if (!hub) {
      throw new ApiError(404, 'NOT_FOUND', `Hub ${body.hubKey} not found.`)
    }

    const created = await createAgent(supabase, orgId, {
      hub_id: hub.id,
      agent_key: body.agentKey,
      name: body.name,
      description: body.description ?? null,
      specialization: body.specialization ?? null,
      skills: body.skills ?? [],
      memory_profile: body.memoryProfile ?? null,
      max_tokens: body.maxTokens ?? null,
      config: body.config ?? {},
      is_active: true,
    })

    return jsonResponse({ agent: serializeAgent(created) }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleRouteError(
        new ApiError(422, 'VALIDATION_ERROR', 'Invalid agent payload.', {
          issues: error.flatten(),
        }),
      )
    }

    return handleRouteError(error)
  }
}
