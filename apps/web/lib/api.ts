interface ApiErrorShape {
  error: {
    code: string
    message: string
    details?: Record<string, unknown> | null
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const data = (await safeJson(response)) as ApiErrorShape | Record<string, unknown>
    const message = 'error' in (data ?? {}) ? (data as ApiErrorShape).error.message : 'Request failed'
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}
