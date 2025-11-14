import SopFilters from '@/components/sops/sop-filters'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { apiGet } from '@/lib/api'
import type { Hub, Sop } from '@/types/api'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function SopsPage({ searchParams }: PageProps): Promise<JSX.Element> {
  const hubFilter = typeof searchParams.hub === 'string' ? searchParams.hub : undefined
  const [sopsData, hubsData] = await Promise.all([
    apiGet<{ sops: Sop[] }>(hubFilter ? `/api/sops?hubKey=${hubFilter}` : '/api/sops'),
    apiGet<{ hubs: Hub[] }>('/api/hubs'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SOP Library</h1>
          <p className="text-sm text-gray-600">Review available SOPs by hub and version.</p>
        </div>
        <SopFilters hubs={hubsData.hubs} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sopsData.sops.map((sop) => (
          <Card key={sop.id}>
            <CardHeader title={sop.name} subtitle={sop.sopKey} />
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>{sop.description ?? 'No description provided.'}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Version {sop.version}</span>
                <span>{sop.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
