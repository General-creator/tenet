import type { Tables } from '@tenet/types'

import type { TenetSupabaseClient } from '../client'
import { ensureMaybeSingle } from './utils'

export type Organization = Tables<'organizations'>

export async function getOrganizationById(
  client: TenetSupabaseClient,
  orgId: string,
): Promise<Organization | null> {
  const { data, error } = await client
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}

export async function getOrganizationBySlug(
  client: TenetSupabaseClient,
  orgId: string,
  slug: string,
): Promise<Organization | null> {
  const { data, error } = await client
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .eq('slug', slug)
    .maybeSingle()

  return ensureMaybeSingle({ data, error })
}
