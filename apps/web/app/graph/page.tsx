import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { apiGet } from '@/lib/api'
import type { GraphNode } from '@/types/api'

export default async function GraphPage(): Promise<JSX.Element> {
  const data = await apiGet<{ nodes: GraphNode[] }>('/api/graph/nodes')
  const grouped = data.nodes.reduce<Record<string, GraphNode[]>>((acc, node) => {
    acc[node.nodeType] = acc[node.nodeType] ?? []
    acc[node.nodeType].push(node)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Knowledge Graph</h1>
        <p className="text-sm text-gray-600">Explore SOP and agent nodes grouped by type.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([type, nodes]) => (
          <Card key={type}>
            <CardHeader title={type.toUpperCase()} subtitle={`${nodes.length} nodes`} />
            <CardContent className="space-y-2 text-sm text-gray-700">
              {nodes.map((node) => (
                <div key={node.id} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                  <p className="font-medium text-gray-900">{node.label ?? node.nodeKey}</p>
                  <p className="text-xs text-gray-500">{node.nodeKey}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
