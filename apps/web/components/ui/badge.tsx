import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const variants: Record<'default' | 'success' | 'warning' | 'danger' | 'secondary', string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  secondary: 'bg-gray-200 text-gray-900',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary'
  className?: string
}): JSX.Element {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
