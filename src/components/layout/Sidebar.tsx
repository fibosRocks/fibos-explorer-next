'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wrench } from 'lucide-react'
import { walletNavConfig } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-40 w-64',
        'hidden lg:block',
        'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl',
        'border-r border-slate-200/50 dark:border-white/10',
        'overflow-y-auto',
        className
      )}
    >
      <nav className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Wrench className="w-4 h-4" />
          <span>工具</span>
        </div>

        {/* Nav Items */}
        <div className="space-y-1">
          {walletNavConfig.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-purple-600 dark:text-cyan-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <item.icon className={cn('w-4 h-4', active && 'text-purple-500 dark:text-cyan-400')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
