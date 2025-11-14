import type { Tables, TablesInsert } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'

import { ensureData } from './utils'

export type ExecutionLogRow = Tables<'execution_logs'>
export type ExecutionLogInsert = TablesInsert<'execution_logs'>

export async function insertExecutionLogs(
  client: TenetSupabaseClient,
  orgId: string,
  entries: Array<Omit<ExecutionLogInsert, 'org_id'>>,
): Promise<ExecutionLogRow[]> {
  if (entries.length === 0) {
    return []
  }

  const payload = entries.map((entry) => ({ ...entry, org_id: orgId }))

  const { data, error } = await client.from('execution_logs').insert(payload).select()

  return ensureData({ data, error })
}

export async function listExecutionLogsForRequest(
  client: TenetSupabaseClient,
  orgId: string,
  requestId: string,
): Promise<ExecutionLogRow[]> {
  const { data, error } = await client
    .from('execution_logs')
    .select('*')
    .eq('org_id', orgId)
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  return ensureData({ data, error })
}
