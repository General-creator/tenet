import { listGraphNodes } from '@tenet/core/supabase/queries/graphNodes'
import { getHubByKey } from '@tenet/core/supabase/queries/hubs'
import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeGraphNode } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const hubKey = req.nextUrl.searchParams.get('hubKey') ?? undefined
    const nodeType = req.nextUrl.searchParams.get('nodeType') ?? undefined
    const hub = hubKey ? await getHubByKey(supabase, orgId, hubKey) : null

    if (hubKey && !hub) {
      throw new ApiError(404, 'NOT_FOUND', `Hub ${hubKey} not found.`)
    }

    const nodes = await listGraphNodes(supabase, orgId, {
      nodeType: nodeType ?? undefined,
      hubId: hub?.id,
    })

    return jsonResponse({
      nodes: nodes.map(serializeGraphNode),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
