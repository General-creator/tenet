import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Table({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className={cn('w-full border-collapse text-left text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHeader({ children }: { children: ReactNode }): JSX.Element {
  return <thead className="bg-gray-50 text-xs uppercase tracking-widest text-gray-500">{children}</thead>
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return <tr className={cn('border-b border-gray-100', className)}>{children}</tr>
}

export function TableHead({ children }: { children: ReactNode }): JSX.Element {
  return <th className="px-4 py-3 font-medium">{children}</th>
}

export function TableBody({ children }: { children: ReactNode }): JSX.Element {
  return <tbody className="text-sm text-gray-700">{children}</tbody>
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>
}
