import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { apiGet } from '@/lib/api'
import type { Hub } from '@/types/api'

export default async function HubsPage(): Promise<JSX.Element> {
  const data = await apiGet<{ hubs: Hub[] }>('/api/hubs')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hubs</h1>
        <p className="text-sm text-gray-600">Domain cells organizing SOPs, agents, and routing rules.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.hubs.map((hub) => (
          <Card key={hub.id}>
            <CardHeader title={hub.name} subtitle={hub.key.toUpperCase()} />
            <CardContent>
              <p className="text-sm text-gray-600">{hub.description ?? 'No description yet.'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
