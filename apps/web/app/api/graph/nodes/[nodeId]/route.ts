import { NextRequest } from 'next/server'

import { getRequestContext } from '@/app/api/_lib/context'
import { ApiError, handleRouteError } from '@/app/api/_lib/errors'
import { serializeGraphNode } from '@/app/api/_lib/mappers'
import { jsonResponse } from '@/app/api/_lib/responses'
import { getGraphNodeById, getGraphNodesByIds } from '@tenet/core/supabase/queries/graphNodes'
import { listEdgesForNode } from '@tenet/core/supabase/queries/graphEdges'

interface RouteParams {
  params: {
    nodeId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  try {
    const { supabase, orgId } = await getRequestContext(req)
    const includeNeighbors =
      (req.nextUrl.searchParams.get('includeNeighbors') ?? '').toLowerCase() === 'true'

    const node = await getGraphNodeById(supabase, orgId, params.nodeId)
    if (!node) {
      throw new ApiError(404, 'NOT_FOUND', 'Graph node not found for this org.')
    }

    if (!includeNeighbors) {
      return jsonResponse({ node: serializeGraphNode(node) })
    }

    const edges = await listEdgesForNode(supabase, orgId, node.id)
    const neighborIds = edges.map((edge) =>
      edge.from_node_id === node.id ? edge.to_node_id : edge.from_node_id,
    )
    const neighbors = await getGraphNodesByIds(supabase, orgId, neighborIds)
    const neighborMap = new Map(neighbors.map((n) => [n.id, n]))

    return jsonResponse({
      node: serializeGraphNode(node),
      neighbors: edges.map((edge) => {
        const neighborId = edge.from_node_id === node.id ? edge.to_node_id : edge.from_node_id
        const neighbor = neighborMap.get(neighborId)
        return {
          ...(neighbor ? serializeGraphNode(neighbor) : { id: neighborId }),
          relationType: edge.relation_type,
        }
      }),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
