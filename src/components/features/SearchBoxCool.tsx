'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { parseSearchQuery } from '@/lib/utils/search'
import { Search, Sparkles } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export function SearchBoxCool() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const result = parseSearchQuery(trimmed)
    if (result.type !== 'invalid') {
      router.push(result.path)
      setQuery('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        {/* Glow effect */}
        <div
          className={`
            absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-all duration-500
            bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600
            ${isFocused ? 'opacity-50 dark:opacity-70' : 'group-hover:opacity-30 dark:group-hover:opacity-40'}
          `}
        />

        {/* Border gradient */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/30 via-cyan-500/30 to-purple-500/30 dark:from-purple-500/50 dark:via-cyan-500/50 dark:to-purple-500/50 opacity-50" />

        {/* Input container */}
        <div className="relative flex items-center bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-lg dark:shadow-none">
          <Search
            className={`
              absolute left-5 h-5 w-5 transition-colors duration-300
              ${isFocused ? 'text-purple-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}
            `}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('search.placeholder')}
            autoFocus
            className="
              w-full h-14 md:h-14 pl-12 md:pl-14 pr-14 md:pr-28
              bg-transparent
              text-slate-900 dark:text-white text-base
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              rounded-2xl
              outline-none
            "
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className={`
              absolute right-2 h-11 md:h-10 px-4 md:px-5
              flex items-center gap-2
              rounded-xl font-medium text-sm
              transition-all duration-300
              ${query.trim()
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}
            `}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{t('search.button')}</span>
          </button>
        </div>
      </div>

      {/* Hints */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 md:gap-4 text-xs text-slate-500 dark:text-slate-600">
        <kbd className="px-2 py-1.5 md:py-1 bg-white/50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-700/50 shadow-sm">{t('search.keywords.block')}</kbd>
        <kbd className="px-2 py-1.5 md:py-1 bg-white/50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-700/50 shadow-sm">{t('search.keywords.tx')}</kbd>
        <kbd className="px-2 py-1.5 md:py-1 bg-white/50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-700/50 shadow-sm">{t('search.keywords.account')}</kbd>
        <kbd className="hidden sm:inline-block px-2 py-1.5 md:py-1 bg-white/50 dark:bg-slate-800/50 rounded border border-slate-200/50 dark:border-slate-700/50 shadow-sm">{t('search.keywords.pubkey')}</kbd>
      </div>
    </form>
  )
}
