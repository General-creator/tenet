import Link from 'next/link'

import RequestFilters from '@/components/requests/request-filters'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiGet } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { Hub, RequestSummary } from '@/types/api'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function RequestsPage({ searchParams }: PageProps): Promise<JSX.Element> {
  const [requestsResponse, hubsResponse] = await Promise.all([
    apiGet<{ requests: RequestSummary[] }>('/api/requests?limit=100'),
    apiGet<{ hubs: Hub[] }>('/api/hubs'),
  ])
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : undefined
  const hubFilter = typeof searchParams.hub === 'string' ? searchParams.hub : undefined

  const filtered = requestsResponse.requests.filter((request) => {
    const matchesStatus = statusFilter ? request.status === statusFilter : true
    const matchesHub = hubFilter ? request.hubId?.startsWith(hubFilter) : true
    return matchesStatus && matchesHub
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-600">Monitor every cognitive request and routing decision.</p>
        </div>
        <RequestFilters hubs={hubsResponse.hubs} />
      </div>
      <Card>
        <CardHeader title="All Requests" subtitle="Filtered results" />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Hub</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                    No requests match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                    <TableCell>{request.hubId ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{request.intent ?? 'Unclassified'}</span>
                        <span className="text-xs text-gray-500">{request.sopKey ?? 'No SOP'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <Link className="text-gray-600 hover:text-gray-900" href={`/requests/${request.id}`}>
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestSummary['status'] }): JSX.Element {
  const variant =
    status === 'completed' ? 'success' : status === 'failed' ? 'danger' : status === 'in_progress' ? 'warning' : 'default'

  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
}
