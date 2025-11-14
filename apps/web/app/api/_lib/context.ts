import { Buffer } from 'node:buffer'

import { createSupabaseClient, type TenetSupabaseClient } from '@tenet/core/supabase/client'
import type { NextRequest } from 'next/server'


import { ApiError } from './errors'

interface JwtPayload {
  org_id?: string
  sub?: string
  user_id?: string
  roles?: string[]
  hubs?: string[]
}

export interface RequestContext {
  supabase: TenetSupabaseClient
  token: string
  orgId: string
  userId?: string
  roles: string[]
  hubs: string[]
}

export async function getRequestContext(req: NextRequest): Promise<RequestContext> {
  const authorization = req.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'A valid bearer token is required.')
  }

  const token = authorization.replace('Bearer', '').trim()
  const payload = decodeJwtPayload(token)

  if (!payload.org_id) {
    throw new ApiError(403, 'FORBIDDEN', 'Token is missing required org claims.')
  }

  const supabase = createSupabaseClient({ accessToken: token })

  return {
    supabase,
    token,
    orgId: payload.org_id,
    userId: payload.sub ?? payload.user_id,
    roles: payload.roles ?? [],
    hubs: payload.hubs ?? [],
  }
}

function decodeJwtPayload(token: string): JwtPayload {
  const segments = token.split('.')
  if (segments.length < 2) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Malformed JWT provided.')
  }

  const payloadSegment = segments[1]
  const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const decoded = Buffer.from(normalized + pad, 'base64').toString('utf8')

  try {
    return JSON.parse(decoded)
  } catch {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Unable to parse JWT payload.')
  }
}
