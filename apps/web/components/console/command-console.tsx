'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Hub } from '@/types/api'

interface Props {
  hubs: Hub[]
}

export default function CommandConsole({ hubs }: Props): JSX.Element {
  const [text, setText] = useState('')
  const [hubKey, setHubKey] = useState<string>(hubs[0]?.key ?? '')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [metadataSource, setMetadataSource] = useState('console')
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setResultMessage(null)

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          hubKey: hubKey || undefined,
          priority,
          metadata: { source: metadataSource },
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error?.message ?? 'Execution failed')
      }

      const payload = await response.json()
      setResultMessage(`Request ${payload.request.id} queued with status ${payload.request.status}.`)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900" htmlFor="tenet-text">
          Describe what you want Tenet to do
        </label>
        <Textarea
          id="tenet-text"
          placeholder="e.g., Process the invoice from Scott Ventures for $600"
          value={text}
          onChange={(event) => setText(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Hub</label>
          <Select value={hubKey} onChange={(event) => setHubKey(event.target.value)}>
            <option value="">Auto</option>
            {hubs.map((hub) => (
              <option key={hub.id} value={hub.key}>
                {hub.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Priority</label>
          <Select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Source</label>
          <Input value={metadataSource} onChange={(event) => setMetadataSource(event.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button disabled={isSubmitting || !text.trim()} type="submit">
          {isSubmitting ? 'Executing...' : 'Execute'}
        </Button>
        {resultMessage ? <p className="text-sm text-green-700">{resultMessage}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </form>
  )
}
