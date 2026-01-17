'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Vote, ChevronDown, Loader2, User, Users } from 'lucide-react'
import { Collapsible } from '@/components/ui/collapsible'
import * as apiClient from '@/lib/services/api-client'
import type { ProducerVoter } from '@/lib/services/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

interface ProducerVotersProps {
  accountName: string
}

export function ProducerVoters({ accountName }: ProducerVotersProps) {
  const { t } = useTranslation()
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [voters, setVoters] = useState<ProducerVoter[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Initial Check
  useEffect(() => {
    async function checkProducer() {
      setLoading(true)
      try {
        const votes = await apiClient.getProducerVotes(accountName)
        setTotalVotes(votes)

        if (votes > 0) {
          // It is a producer, fetch initial voters (page 0)
          const initialVoters = await apiClient.getProducerVoters(accountName, 0)

          // Sort by vote weight descending
          const sortedVoters = [...initialVoters].sort((a, b) =>
            parseFloat(b.last_vote_weight) - parseFloat(a.last_vote_weight)
          )

          setVoters(sortedVoters)
          // Assume has more if we got a decent amount of results
          setHasMore(initialVoters.length > 0)
        }
      } catch (err) {
        console.error('Failed to check producer status', err)
      } finally {
        setLoading(false)
      }
    }

    checkProducer()
  }, [accountName])

  const handleLoadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const newVoters = await apiClient.getProducerVoters(accountName, nextPage)

      if (newVoters.length > 0) {
        setVoters(prev => {
          // Combine, remove duplicates by owner, and sort
          const combined = [...prev, ...newVoters]
          const uniqueMap = new Map()
          combined.forEach(v => uniqueMap.set(v.owner, v))
          const uniqueList = Array.from(uniqueMap.values()) as ProducerVoter[]

          return uniqueList.sort((a, b) =>
            parseFloat(b.last_vote_weight) - parseFloat(a.last_vote_weight)
          )
        })
        setPage(nextPage)
        setHasMore(true)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more voters', err)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading && totalVotes === 0) return null
  if (totalVotes <= 0) return null

  return (
    <Collapsible
      title={t('account.producerVotes')}
      badge={`${(totalVotes / 10000).toFixed(4)} FO`}
      defaultOpen={false}
    >
      <div className="bg-slate-50 dark:bg-slate-900/20">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-200/50 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-4">{t('account.voter')}</div>
          <div className="col-span-3 text-right">{t('account.staked')}</div>
          <div className="col-span-3 text-right">{t('account.voteWeight')}</div>
          <div className="col-span-2 text-center">{t('account.isProxy')}</div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {voters.map((voter, index) => (
            <div key={`${voter.owner}-${index}`} className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-sm">
              <div className="col-span-4 font-mono truncate">
                <Link href={`/explorer/accounts/${voter.owner}`} className="text-purple-600 dark:text-cyan-400 hover:underline">
                  {voter.owner}
                </Link>
              </div>
              <div className="col-span-3 text-right font-mono text-slate-700 dark:text-slate-300">
                {(voter.staked / 10000).toFixed(4)}
              </div>
              <div className="col-span-3 text-right font-mono text-slate-500 dark:text-slate-400">
                {(parseFloat(voter.last_vote_weight) / 10000).toFixed(4)}
              </div>
              <div className="col-span-2 flex justify-center">
                {voter.is_proxy ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    {t('account.yes')}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">-</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="p-4 border-t border-slate-200/50 dark:border-white/10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loadingMore ? (
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
      </div>
    </Collapsible>
  )
}
