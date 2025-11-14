import { listExecutionLogsForRequest } from '@tenet/core/supabase/queries/executionLogs'
import { listRoutingDecisionsForRequest } from '@tenet/core/supabase/queries/routingDecisions'
import { getTenetRequestById } from '@tenet/core/supabase/queries/tenetRequests'
import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeRequest, serializeRoutingDecision, serializeLogs } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'

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

    const [routingDecisions, executionLogs] = await Promise.all([
      listRoutingDecisionsForRequest(supabase, orgId, request.id),
      listExecutionLogsForRequest(supabase, orgId, request.id),
    ])

    const latestRouting = routingDecisions.at(0)
    const logsPayload = serializeLogs(executionLogs)
    const result =
      logsPayload.length > 0
        ? {
            status: executionLogs.some((log) => log.status === 'error') ? 'failed' : 'success',
            output: executionLogs.at(-1)?.payload ?? {},
          }
        : undefined

    return jsonResponse({
      request: serializeRequest(request),
      routing: serializeRoutingDecision(latestRouting),
      result,
      logs: logsPayload,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
