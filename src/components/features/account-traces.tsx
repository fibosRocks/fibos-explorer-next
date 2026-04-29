'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRightLeft, Loader2, ChevronDown } from 'lucide-react'
import type { Action, AccountHistoryItem } from '@/lib/services/types'
import { getAccountHistoryPage } from '@/lib/services/api-client'
import { useTranslation } from '@/lib/i18n'
import { ActionCardSummary } from '@/components/features/action-card'
import { Pagination } from '@/components/ui/pagination'

interface AccountTracesProps {
  accountName: string
}

interface GroupedTrace {
  trx_id: string
  block_num: number
  block_time: string
  actions: Action[]
}

const PAGE_SIZE = 50

function groupItems(items: AccountHistoryItem[]): GroupedTrace[] {
  const groups: GroupedTrace[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.trx_id === item.trx_id) {
      last.actions.push(item.act)
    } else {
      groups.push({
        trx_id: item.trx_id,
        block_num: item.block_num,
        block_time: item.block_time,
        actions: [item.act],
      })
    }
  }
  return groups
}

export function AccountTraces({ accountName }: AccountTracesProps) {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [groupedTraces, setGroupedTraces] = useState<GroupedTrace[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [appending, setAppending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Jump to a specific page — replaces all content, scrolls to top
  const fetchPage = useCallback(async (p: number) => {
    try {
      setLoading(true)
      setError(null)
      const resp = await getAccountHistoryPage(accountName, p, PAGE_SIZE)
      setGroupedTraces(groupItems(resp.items))
      setTotal(resp.total)
      setPage(p)
      setHasMore(resp.has_more)
      const top = sectionRef.current?.offsetTop ?? 0
      window.scrollTo({ top: top - 20, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError(t('account.fetchError'))
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [accountName, t])

  // Append next page — cross-page merge, no scroll
  const appendNextPage = useCallback(async () => {
    const nextPage = page + 1
    try {
      setAppending(true)
      const resp = await getAccountHistoryPage(accountName, nextPage, PAGE_SIZE)
      const newGroups = groupItems(resp.items)

      setGroupedTraces(prev => {
        const prevLast = prev[prev.length - 1]
        const firstNew = newGroups[0]
        if (prevLast && firstNew && prevLast.trx_id === firstNew.trx_id) {
          const merged = [...prev]
          merged[merged.length - 1] = {
            ...prevLast,
            actions: [...prevLast.actions, ...firstNew.actions],
          }
          return [...merged, ...newGroups.slice(1)]
        }
        return [...prev, ...newGroups]
      })
      setPage(nextPage)
      setHasMore(resp.has_more)
    } catch (err) {
      console.error('Failed to load next page:', err)
    } finally {
      setAppending(false)
    }
  }, [accountName, page])

  // Reset to page 1 when account changes
  useEffect(() => {
    setPage(1)
    setTotal(0)
    setGroupedTraces([])
    setHasMore(false)
    setInitialLoading(true)
    fetchPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountName])

  const handlePageChange = (newPage: number) => {
    if (newPage !== page) fetchPage(newPage)
  }

  return (
    <div ref={sectionRef} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
      <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('account.transactionHistory')}</h2>
        </div>
        {total > 0 && (
          <span className="text-sm text-slate-500">
            {t('common.total')} {total.toLocaleString()} {t('common.transactions')}
          </span>
        )}
      </div>

      <div className="">
        {initialLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : error && groupedTraces.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{error}</div>
        ) : groupedTraces.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{t('account.noTransactions')}</div>
        ) : (
          <>
            {totalPages > 1 && (
              <div className="px-4 pt-3 border-b border-slate-200/50 dark:border-white/10">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} disabled={loading} />
              </div>
            )}

            <div className="divide-y divide-slate-200/50 dark:divide-white/10">
              {groupedTraces.map((trace, index) => (
                <div key={`${trace.trx_id}-${index}`} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="sm:w-48 shrink-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/explorer/transactions/${trace.trx_id}`}
                          className="font-mono text-sm text-purple-600 dark:text-cyan-400 hover:underline truncate"
                          title={trace.trx_id}
                        >
                          {trace.trx_id.substring(0, 8)}...{trace.trx_id.substring(trace.trx_id.length - 8)}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <Link
                          href={`/explorer/blocks/${trace.block_num}`}
                          className="hover:text-purple-500"
                        >
                          #{trace.block_num.toLocaleString()}
                        </Link>
                        <span>·</span>
                        <span>{trace.block_time.split('T')[0]} {trace.block_time.split('T')[1]?.split('.')[0] ?? ''}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {trace.actions.map((action, i) => (
                        <ActionCardSummary key={i} action={action} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom: Next Page button (append) + Pagination (jump) */}
            <div className="border-t border-slate-200/50 dark:border-white/10">
              {hasMore && (
                <div className="px-4 pt-4">
                  <button
                    onClick={appendNextPage}
                    disabled={appending}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {appending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {t('common.loadMore')}
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="p-4">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} disabled={loading || appending} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
