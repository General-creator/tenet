import Link from 'next/link'

import CommandConsole from '@/components/console/command-console'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiGet } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { Hub, RequestSummary } from '@/types/api'

export default async function HomePage(): Promise<JSX.Element> {
  const [{ hubs }, { requests }] = await Promise.all([
    apiGet<{ hubs: Hub[] }>('/api/hubs'),
    apiGet<{ requests: RequestSummary[] }>('/api/requests?limit=20'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Command Console</h1>
        <p className="text-sm text-gray-600">Describe what you need and Tenet will route it.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader title="Command Console" subtitle="Submit a new cognitive request" />
          <CardContent>
            <CommandConsole hubs={hubs} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Recent Requests" subtitle="Latest Tenet activity" />
          <CardContent>
            <RecentRequests requests={requests} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RecentRequests({ requests }: { requests: RequestSummary[] }): JSX.Element {
  if (requests.length === 0) {
    return <p className="text-sm text-gray-600">No requests yet.</p>
  }

  return (
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
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{formatDateTime(request.createdAt)}</TableCell>
            <TableCell className="capitalize">{request.hubId?.split('_')[0] ?? '—'}</TableCell>
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
        ))}
      </TableBody>
    </Table>
  )
}

function StatusBadge({ status }: { status: RequestSummary['status'] }): JSX.Element {
  const variant =
    status === 'completed' ? 'success' : status === 'failed' ? 'danger' : status === 'in_progress' ? 'warning' : 'default'

  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
}
