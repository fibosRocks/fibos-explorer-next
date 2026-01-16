'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleProps {
  title: string
  badge?: string | number
  defaultOpen?: boolean
  children: ReactNode
}

export function Collapsible({ title, badge, defaultOpen = false, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-slate-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t border-slate-200/50 dark:border-white/10">
          {children}
        </div>
      )}
    </div>
  )
}
