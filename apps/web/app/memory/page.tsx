import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { apiGet } from '@/lib/api'
import type { MemoryRecord } from '@/types/api'

export default async function MemoryPage(): Promise<JSX.Element> {
  const data = await apiGet<{ records: MemoryRecord[] }>('/api/memory')
  const grouped = data.records.reduce<Record<string, MemoryRecord[]>>((acc, record) => {
    acc[record.scope] = acc[record.scope] ?? []
    acc[record.scope].push(record)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Memory</h1>
        <p className="text-sm text-gray-600">Inspect retrieved memory records grouped by scope.</p>
      </div>
      <div className="space-y-4">
        {Object.entries(grouped).map(([scope, records]) => (
          <Card key={scope}>
            <CardHeader title={scope.toUpperCase()} subtitle={`${records.length} records`} />
            <CardContent className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                  <p className="font-medium text-gray-900">{record.entityKey ?? 'Untitled memory'}</p>
                  <p className="text-gray-600">{record.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
