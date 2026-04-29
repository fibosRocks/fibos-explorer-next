'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  pages.push(1)

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  if (end < totalPages - 1) pages.push('ellipsis')

  if (totalPages > 1) pages.push(totalPages)
  return pages
}

const baseBtn =
  'inline-flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'

export function Pagination({ currentPage, totalPages, onPageChange, disabled }: PaginationProps) {
  const { t } = useTranslation()
  const [jumpInput, setJumpInput] = useState('')

  if (totalPages <= 1) return null

  const handleJump = () => {
    const raw = parseInt(jumpInput, 10)
    if (isNaN(raw)) return
    const clamped = Math.max(1, Math.min(totalPages, raw))
    setJumpInput('')
    if (clamped !== currentPage) onPageChange(clamped)
  }

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 py-2">
      <button
        onClick={() => onPageChange(1)}
        disabled={disabled || currentPage === 1}
        className={baseBtn}
        title={t('common.firstPage')}
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className={baseBtn}
        title={t('common.prevPage')}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400 select-none">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            disabled={disabled || p === currentPage}
            className={
              p === currentPage
                ? `${baseBtn} bg-emerald-500 text-white shadow-sm`
                : `${baseBtn} hover:bg-slate-100 dark:hover:bg-white/10`
            }
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className={baseBtn}
        title={t('common.nextPage')}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={disabled || currentPage === totalPages}
        className={baseBtn}
        title={t('common.lastPage')}
      >
        <ChevronsRight className="w-4 h-4" />
      </button>

      <span className="ml-3 flex items-center gap-1.5 text-sm text-slate-500">
        <span>{t('common.jumpTo')}</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpInput}
          onChange={e => setJumpInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJump()}
          disabled={disabled}
          className="w-14 h-8 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-center text-sm"
        />
        <span>{t('common.page')}</span>
      </span>
    </div>
  )
}
