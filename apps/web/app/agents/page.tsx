import AgentFilters from '@/components/agents/agent-filters'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { apiGet } from '@/lib/api'
import type { Agent, Hub } from '@/types/api'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function AgentsPage({ searchParams }: PageProps): Promise<JSX.Element> {
  const hubFilter = typeof searchParams.hub === 'string' ? searchParams.hub : undefined
  const [agentsData, hubsData] = await Promise.all([
    apiGet<{ agents: Agent[] }>(hubFilter ? `/api/agents?hubKey=${hubFilter}` : '/api/agents'),
    apiGet<{ hubs: Hub[] }>('/api/hubs'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-600">Domain-specific executors available inside Tenet.</p>
        </div>
        <AgentFilters hubs={hubsData.hubs} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {agentsData.agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader title={agent.name} subtitle={agent.agentKey} />
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>{agent.description ?? 'No description provided.'}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Badge variant="secondary" className="bg-gray-100 text-gray-900">
                  {agent.specialization ?? 'generalist'}
                </Badge>
                <span>{agent.skills.length} skills</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
