import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { handleRouteError } from '@/app/api/_lib/errors'
import { serializeHub } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'
import { listHubsForOrg } from '@tenet/core/supabase/queries/hubs'

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const hubs = await listHubsForOrg(supabase, orgId)
    return jsonResponse({ hubs: hubs.map(serializeHub) })
  } catch (error) {
    return handleRouteError(error)
  }
}
