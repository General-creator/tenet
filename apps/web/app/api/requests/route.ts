import { listRecentRequests } from '@tenet/core/supabase/queries/tenetRequests'
import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { handleRouteError } from '@/app/api/_lib/errors'
import { serializeRequest } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '20')
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20

    const requests = await listRecentRequests(supabase, orgId, limit)
    return jsonResponse({
      requests: requests.map(serializeRequest),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
