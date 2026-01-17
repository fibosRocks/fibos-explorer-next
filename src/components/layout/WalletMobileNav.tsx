'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { walletNavConfig } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export function WalletMobileNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // 获取当前激活的菜单项
  const currentItem = walletNavConfig.find(item => isActive(item.href)) ?? walletNavConfig[0]!

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="lg:hidden relative" ref={menuRef}>
      {/* 当前选中项按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <currentItem.icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-medium text-slate-900 dark:text-white">
              {t(currentItem.labelKey)}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ChevronDown className="w-3 h-3" />
              {t('nav.tapToSwitch')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* 显示其他功能的图标 */}
          {walletNavConfig
            .filter(item => item.href !== currentItem.href)
            .map((item) => (
              <div
                key={item.href}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
              >
                <item.icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
        </div>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
          {walletNavConfig.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors',
                  active
                    ? 'bg-purple-500/10 text-purple-600 dark:text-cyan-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5',
                  active ? 'text-purple-500 dark:text-cyan-400' : 'text-slate-400'
                )} />
                <span className="font-medium">{t(item.labelKey)}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-purple-500 dark:bg-cyan-400" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
