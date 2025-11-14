'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Select } from '@/components/ui/select'
import type { Hub } from '@/types/api'

interface Props {
  hubs: Hub[]
}

const statuses: Array<'pending' | 'in_progress' | 'completed' | 'failed'> = [
  'pending',
  'in_progress',
  'completed',
  'failed',
]

export default function RequestFilters({ hubs }: Props): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function updateFilters(next: Record<string, string | undefined>): void {
    const newParams = new URLSearchParams(params.toString())
    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    router.push(`${pathname}?${newParams.toString()}`)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Status</label>
        <Select value={params.get('status') ?? ''} onChange={(event) => updateFilters({ status: event.target.value || undefined })}>
          <option value="">All</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Hub</label>
        <Select value={params.get('hub') ?? ''} onChange={(event) => updateFilters({ hub: event.target.value || undefined })}>
          <option value="">All</option>
          {hubs.map((hub) => (
            <option key={hub.id} value={hub.key}>
              {hub.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
