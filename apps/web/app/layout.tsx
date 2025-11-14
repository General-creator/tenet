import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Tenet Console',
  description: 'Tenet Cognitive Telecom Platform',
}

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className={cn('min-h-screen bg-background text-foreground antialiased', inter.className)}>
        {children}
      </body>
    </html>
  )
}
