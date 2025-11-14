import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeLogs } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'
import { getTenetRequestById } from '@tenet/core/supabase/queries/tenetRequests'
import { listExecutionLogsForRequest } from '@tenet/core/supabase/queries/executionLogs'

interface RouteParams {
  params: {
    requestId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const request = await getTenetRequestById(supabase, orgId, params.requestId)
    if (!request) {
      throw new ApiError(404, 'NOT_FOUND', 'Request not found for this org.')
    }

    const logs = await listExecutionLogsForRequest(supabase, orgId, request.id)
    return jsonResponse({ logs: serializeLogs(logs) })
  } catch (error) {
    return handleRouteError(error)
  }
}
