'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { parseSearchQuery } from '@/lib/utils/search'
import { cn } from '@/lib/utils'

interface NavbarSearchProps {
  className?: string
  placeholder?: string
}

export function NavbarSearch({ className, placeholder = '搜索区块、交易、账户...' }: NavbarSearchProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = useCallback(() => {
    if (!query.trim()) return

    const result = parseSearchQuery(query.trim())
    if (result && result.type !== 'invalid') {
      router.push(result.path)
      setQuery('')
    }
  }, [query, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

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
          placeholder={placeholder}
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
