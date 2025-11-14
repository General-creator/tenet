import { getHubByKey } from '@tenet/core/supabase/queries/hubs'
import { listMemoryRecords, searchMemoryRecords } from '@tenet/core/supabase/queries/memoryRecords'
import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeMemoryRecord } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const hubKey = req.nextUrl.searchParams.get('hubKey') ?? undefined
    const scope = req.nextUrl.searchParams.get('scope') as
      | 'org'
      | 'hub'
      | 'agent'
      | 'user'
      | undefined
    const entityKey = req.nextUrl.searchParams.get('entityKey') ?? undefined
    const query = req.nextUrl.searchParams.get('q') ?? undefined

    const hub = hubKey ? await getHubByKey(supabase, orgId, hubKey) : null
    if (hubKey && !hub) {
      throw new ApiError(404, 'NOT_FOUND', `Hub ${hubKey} not found.`)
    }

    let records
    if (query) {
      records = await searchMemoryRecords(supabase, orgId, {
        hubId: hub?.id,
        query,
      })
    } else {
      records = await listMemoryRecords(supabase, orgId, scope, entityKey)
    }

    return jsonResponse({
      records: records.map(serializeMemoryRecord),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
