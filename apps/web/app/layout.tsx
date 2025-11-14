import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { apiGet } from '@/lib/api'
import type { Hub } from '@/types/api'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Tenet Console',
  description: 'Tenet Cognitive Telecom Platform',
}

async function fetchHubs(): Promise<Hub[]> {
  const data = await apiGet<{ hubs: Hub[] }>('/api/hubs')
  return data.hubs
}

export default async function RootLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const hubs = await fetchHubs()

  return (
    <html lang="en">
      <body className={cn('min-h-screen bg-background text-foreground antialiased', inter.className)}>
        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="text-xl font-semibold tracking-wide">Tenet</div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs uppercase tracking-widest text-gray-600">
                Cognitive Telecom
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>demo.admin@tenet.local</span>
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs">Tenet Demo Corp</span>
            </div>
          </header>
          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-white/70 px-4 py-6 lg:block">
              <nav className="space-y-6 text-sm">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Navigation</p>
                  <ul className="space-y-1">
                    <NavItem href="/" label="Console" />
                    <NavItem href="/requests" label="Requests" />
                    <NavItem href="/hubs" label="Hubs" />
                    <NavItem href="/sops" label="SOPs" />
                    <NavItem href="/agents" label="Agents" />
                    <NavItem href="/graph" label="Graph" />
                    <NavItem href="/memory" label="Memory" />
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Hubs</p>
                  <ul className="space-y-1">
                    {hubs.length === 0 ? (
                      <li className="text-gray-500">No hubs</li>
                    ) : (
                      hubs.map((hub) => (
                        <li key={hub.id} className="flex items-center justify-between rounded-md px-2 py-1">
                          <span className="text-sm text-gray-700">{hub.name}</span>
                          <span className="text-xs uppercase text-gray-400">{hub.key}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </nav>
            </aside>
            <main className="flex-1 overflow-y-auto bg-gray-50/70 px-6 py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}

function NavItem({ href, label }: { href: string; label: string }): JSX.Element {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100"
      >
        {label}
      </Link>
    </li>
  )
}
