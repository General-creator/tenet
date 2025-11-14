import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, children }: { className?: string; children: ReactNode }): JSX.Element {
  return <div className={cn('rounded-lg border border-gray-200 bg-white shadow-sm', className)}>{children}</div>
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }): JSX.Element {
  return (
    <div className="border-b border-gray-200 px-5 py-4">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
    </div>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}
