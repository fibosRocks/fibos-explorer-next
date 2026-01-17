'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRightLeft, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Action } from '@/lib/services/types'
import * as eos from '@/lib/services/eos-client'
import { useTranslation } from '@/lib/i18n'

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

  // Cursor state: -1 means start, null means no more
  const [nextCursor, setNextCursor] = useState<number | null>(-1)

  const loadTraces = useCallback(async (isInitial = false) => {
    // Prevent loading if already loading or no more data (unless it's initial retry)
    if (loading) return

    // We need to use the current cursor.
    // Since this function depends on state, we need to be careful.
    // Instead of using state in the closure, let's pass cursor as arg or use ref.
    // However, simpler is to rely on the effect to trigger initial load,
    // and manual trigger for next pages.
  }, []) // This is getting complicated with closures.

  // Let's use a simpler approach:
  // - fetchTraces function accepts a cursor.
  // - useEffect calls it with -1 on mount.
  // - Load More button calls it with current `nextCursor`.

  const fetchTraces = async (cursor: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await eos.getActions(accountName, cursor, -20)

      // Reverse to get newest first
      const rawActions = [...response.actions].reverse()

      // Calculate next cursor
      let newNextCursor: number | null = null
      if (rawActions.length > 0) {
        const lastAction = rawActions[rawActions.length - 1]
        const lastSeq = lastAction?.account_action_seq ?? 0
        if (lastSeq > 0) {
          newNextCursor = lastSeq - 1
        }
      }
      setNextCursor(newNextCursor)

      // Group by trx_id
      const groups: GroupedTrace[] = []
      let currentGroup: GroupedTrace | null = null

      for (const trace of rawActions) {
        const trxId = trace.action_trace.trx_id

        if (!currentGroup || currentGroup.trx_id !== trxId) {
          if (currentGroup) groups.push(currentGroup)
          currentGroup = {
            trx_id: trxId,
            block_num: trace.block_num,
            block_time: trace.block_time,
            actions: []
          }
        }
        currentGroup.actions.push(trace.action_trace.act)
      }
      if (currentGroup) groups.push(currentGroup)

      // Append or Replace
      setGroupedTraces(prev => cursor === -1 ? groups : [...prev, ...groups])

    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError(t('account.fetchError'))
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  // Reset and load initial
  useEffect(() => {
    setGroupedTraces([])
    setNextCursor(-1)
    setInitialLoading(true)
    fetchTraces(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountName])

  const handleLoadMore = () => {
    if (nextCursor !== null) {
      fetchTraces(nextCursor)
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
                    {/* Left: TX Info */}
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

                    {/* Right: Actions */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {trace.actions.map((action, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 text-sm w-full">
                          {/* Left: Action Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 font-mono">
                              {action.name}
                            </span>
                          </div>

                          {/* Right: Details */}
                          <div className="flex-1 flex justify-end min-w-0">
                            {action.name === 'transfer' && action.data ? (
                              <div className="flex flex-wrap items-center justify-end gap-x-2 text-slate-700 dark:text-slate-200">
                                <Link href={`/explorer/accounts/${(action.data as any).from}`} className="text-purple-600 dark:text-cyan-400 hover:underline">
                                  {(action.data as any).from}
                                </Link>
                                <span className="text-slate-400">→</span>
                                <Link href={`/explorer/accounts/${(action.data as any).to}`} className="text-purple-600 dark:text-cyan-400 hover:underline">
                                  {(action.data as any).to}
                                </Link>
                                <span className="font-medium whitespace-nowrap">{(action.data as any).quantity}</span>
                                {(action.data as any).memo && (
                                  <span className="text-slate-400 text-xs italic truncate max-w-[150px] hidden md:inline-block" title={(action.data as any).memo}>
                                    {(action.data as any).memo}
                                  </span>
                                )}
                              </div>
                            ) : (
                               <span className="text-slate-400 text-xs truncate max-w-[200px]" title={JSON.stringify(action.data)}>
                                 {action.account}
                               </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {nextCursor !== null && (
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
