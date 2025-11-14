export type RoutingErrorCode =
  | 'NO_HUB_RESOLVED'
  | 'NO_SOP_FOUND'
  | 'NO_AGENT_AVAILABLE'
  | 'NO_MODEL_AVAILABLE'
  | 'BUDGET_EXCEEDED'
  | 'INTERNAL_ROUTING_ERROR'

export class RoutingError extends Error {
  constructor(
    public readonly code: RoutingErrorCode,
    message?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code)
  }
}
