export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export function errorResponse(error: ApiError): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    }),
    {
      status: error.status,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export function handleRouteError(err: unknown): Response {
  if (err instanceof ApiError) {
    return errorResponse(err)
  }

  return errorResponse(
    new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.', {
      cause: err instanceof Error ? err.message : String(err),
    }),
  )
}
