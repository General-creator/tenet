import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { apiGet } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { ExecutionLog, RequestDetailResponse } from '@/types/api'

interface PageProps {
  params: {
    requestId: string
  }
}

export default async function RequestDetailPage({ params }: PageProps): Promise<JSX.Element> {
  const [detail, logs] = await Promise.all([
    apiGet<RequestDetailResponse>(`/api/requests/${params.requestId}`),
    apiGet<{ logs: ExecutionLog[] }>(`/api/requests/${params.requestId}/logs`),
  ])

  return (
    <div className="space-y-6">
      <Link className="text-sm text-gray-600 hover:text-gray-900" href="/requests">
        ← Back to requests
      </Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Request Summary" subtitle={`Request ${detail.request.id}`} />
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Created</p>
                <p>{formatDateTime(detail.request.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Hub</p>
                <p>{detail.request.hubId ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Intent</p>
                <p>{detail.request.intent ?? 'Unclassified'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">SOP</p>
                <p>{detail.request.sopKey ?? '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">Raw Input</p>
              <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-800">{detail.request.rawInput}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-widest text-gray-500">Status</p>
              <StatusBadge status={detail.request.status} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Routing Decision" subtitle="Model selection + QoS" />
          <CardContent className="space-y-3 text-sm text-gray-700">
            {detail.routing ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Model</p>
                  <p>{detail.routing.modelName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">QoS Tier</p>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                    {detail.routing.qosTier ?? '—'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Metric label="Tokens" value={detail.routing.estimatedTokens?.toString() ?? '—'} />
                  <Metric label="Cost" value={detail.routing.estimatedCost ? `$${detail.routing.estimatedCost}` : '—'} />
                  <Metric label="Latency" value={detail.routing.estimatedLatencyMs ? `${detail.routing.estimatedLatencyMs}ms` : '—'} />
                </div>
              </>
            ) : (
              <p>No routing record found.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader title="Execution Trace" subtitle="Planned or completed steps" />
        <CardContent className="space-y-4">
          {(logs.logs.length ? logs.logs : detail.logs ?? []).map((log) => (
            <div key={log.id} className="flex items-start justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{log.stepName ?? 'Step'}</p>
                <p className="text-xs text-gray-500">{log.detail ?? 'No details'}</p>
              </div>
              <Badge variant={log.status === 'error' ? 'danger' : log.status === 'success' ? 'success' : 'warning'}>{log.status}</Badge>
            </div>
          ))}
          {logs.logs.length === 0 && (!detail.logs || detail.logs.length === 0) ? (
            <p className="text-sm text-gray-600">No execution logs yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestDetailResponse['request']['status'] }): JSX.Element {
  const variant =
    status === 'completed' ? 'success' : status === 'failed' ? 'danger' : status === 'in_progress' ? 'warning' : 'default'

  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
}

function Metric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}
