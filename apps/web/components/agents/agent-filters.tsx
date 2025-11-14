'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Select } from '@/components/ui/select'
import type { Hub } from '@/types/api'

interface Props {
  hubs: Hub[]
}

export default function AgentFilters({ hubs }: Props): JSX.Element {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  function updateHub(value: string): void {
    const next = new URLSearchParams(params.toString())
    if (value) {
      next.set('hub', value)
    } else {
      next.delete('hub')
    }
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Hub</label>
      <Select value={params.get('hub') ?? ''} onChange={(event) => updateHub(event.target.value)}>
        <option value="">All</option>
        {hubs.map((hub) => (
          <option key={hub.id} value={hub.key}>
            {hub.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
