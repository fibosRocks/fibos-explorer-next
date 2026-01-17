'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { parseSearchQuery } from '@/lib/utils/search'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface NavbarSearchProps {
  className?: string
  placeholder?: string
  mode?: 'full' | 'icon'
}

export function NavbarSearch({
  className,
  placeholder,
  mode = 'full'
}: NavbarSearchProps) {
  const { t } = useTranslation()
  const finalPlaceholder = placeholder || t('search.placeholder')

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(() => {
    if (!query.trim()) return

    const result = parseSearchQuery(query.trim())
    if (result && result.type !== 'invalid') {
      router.push(result.path)
      setQuery('')
      setIsOpen(false)
    }
  }, [query, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Icon Mode
  if (mode === 'icon') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors',
            className
          )}
          aria-label={t('search.ariaLabel')}
        >
          <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {isOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-top-4 duration-200 border border-slate-200 dark:border-slate-700">
              <div className="relative flex items-center p-2">
                <Search className="absolute left-5 w-5 h-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={finalPlaceholder}
                  className="w-full h-12 pl-12 pr-12 bg-transparent text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-3 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
                <span>{t('search.support')}</span>
                <span className="font-mono">{t('search.esc')}</span>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  // Full Mode
  return (
    <div
      className={cn(
        'relative flex items-center w-full',
        className
      )}
    >
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          className={cn(
            'w-full h-10 pl-10 pr-4 rounded-xl',
            'bg-slate-100 dark:bg-slate-800/50',
            'border border-slate-200 dark:border-slate-700',
            'text-slate-900 dark:text-white text-sm',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500',
            'transition-all duration-200'
          )}
        />
      </div>
    </div>
  )
}
