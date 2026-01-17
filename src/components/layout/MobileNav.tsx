'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { mobileNavConfig } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'lg:hidden',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
        'border-t border-slate-200/50 dark:border-white/10',
        'pb-safe',
        className
      )}
    >
      <div className="flex items-center justify-around h-16">
        {mobileNavConfig.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[64px]',
                'text-xs font-medium transition-colors duration-200',
                active
                  ? 'text-purple-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <item.icon
                className={cn(
                  'w-6 h-6',
                  active && 'text-purple-600 dark:text-cyan-400'
                )}
              />
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
