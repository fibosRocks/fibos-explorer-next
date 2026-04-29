'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRightLeft, Loader2, ChevronDown } from 'lucide-react'
import type { Action } from '@/lib/services/types'
import { getAccountHistory } from '@/lib/services/api-client'
import { useTranslation } from '@/lib/i18n'
import { ActionCardSummary } from '@/components/features/action-card'

interface AccountTracesProps {
  accountName: string
}

interface GroupedTrace {
  trx_id: string
  block_num: number
  block_time: string
  actions: Action[]
}

export function AccountTraces({ accountName }: AccountTracesProps) {
  const { t } = useTranslation()
  const [groupedTraces, setGroupedTraces] = useState<GroupedTrace[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchHistory = async (currentCursor: number | null, isInitial: boolean) => {
    try {
      setLoading(true)
      setError(null)

      const resp = await getAccountHistory(accountName, currentCursor, 50)

      // Server returns newest-first; group consecutive same-trx_id actions
      const newGroups: GroupedTrace[] = []
      for (const item of resp.items) {
        const last = newGroups[newGroups.length - 1]
        if (last && last.trx_id === item.trx_id) {
          last.actions.push(item.act)
        } else {
          newGroups.push({
            trx_id: item.trx_id,
            block_num: item.block_num,
            block_time: item.block_time,
            actions: [item.act],
          })
        }
      }

      setGroupedTraces(prev => {
        if (isInitial) return newGroups
        // Merge cross-page: if last group of prev and first group of new share trx_id
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

      setCursor(resp.next_cursor)
      setHasMore(resp.has_more)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError(t('account.fetchError'))
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    setGroupedTraces([])
    setCursor(null)
    setHasMore(true)
    setInitialLoading(true)
    fetchHistory(null, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountName])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchHistory(cursor, false)
    }
  }

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
      <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('account.transactionHistory')}</h2>
        </div>
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

            {hasMore && (
              <div className="p-4 border-t border-slate-200/50 dark:border-white/10">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {loading ? (
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
          </>
        )}
      </div>
    </div>
  )
}
