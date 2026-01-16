'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, ChevronDown, Loader2 } from 'lucide-react'
import { Collapsible } from '@/components/ui/collapsible'
import * as apiClient from '@/lib/services/api-client'
import type { ProxiedAccount } from '@/lib/services/types'

interface ProxiedAccountsProps {
  accountName: string
  isProxy: boolean
}

export function ProxiedAccounts({ accountName, isProxy }: ProxiedAccountsProps) {
  const [accounts, setAccounts] = useState<ProxiedAccount[]>([])
  const [proxiedVote, setProxiedVote] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    async function fetchInitial() {
      if (!isProxy) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // 并行获取被代理票数和被代理人列表
        const [vote, data] = await Promise.all([
          apiClient.getProxiedVote(accountName),
          apiClient.getProxiedAccounts(accountName, 0),
        ])

        setProxiedVote(vote)

        // 如果没有被代理票数，不显示
        if (vote <= 0) {
          setLoading(false)
          return
        }

        // 按票数权重排序
        const sorted = [...data].sort((a, b) =>
          parseFloat(b.last_vote_weight) - parseFloat(a.last_vote_weight)
        )
        setAccounts(sorted)
        setHasMore(data.length > 0)
      } catch (err) {
        console.error('获取被代理人列表失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInitial()
  }, [accountName, isProxy])

  const handleLoadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const newAccounts = await apiClient.getProxiedAccounts(accountName, nextPage)

      if (newAccounts.length > 0) {
        setAccounts(prev => {
          const combined = [...prev, ...newAccounts]
          const uniqueMap = new Map()
          combined.forEach(a => uniqueMap.set(a.owner, a))
          const uniqueList = Array.from(uniqueMap.values()) as ProxiedAccount[]
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
      console.error('加载更多被代理人失败:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // 计算显示的票数（API 返回的值需要除以 10000）
  const displayVote = proxiedVote / 10000

  // 如果不是代理人或没有被代理票数，不显示
  if (!isProxy) return null
  if (loading) return null
  if (proxiedVote <= 0) return null

  return (
    <Collapsible
      title="被代理账户"
      badge={`${displayVote.toFixed(4)} FO`}
      defaultOpen={false}
    >
      <div className="bg-slate-50 dark:bg-slate-900/20">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-200/50 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-5">账户</div>
          <div className="col-span-4 text-right">抵押</div>
          <div className="col-span-3 text-right">票数权重</div>
        </div>

        {/* List */}
        {accounts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">暂无被代理账户</div>
        ) : (
          <div className="divide-y divide-slate-200/50 dark:divide-white/10">
            {accounts.map((account, index) => (
              <div
                key={`${account.owner}-${index}`}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-sm"
              >
                <div className="col-span-5 font-mono truncate">
                  <Link
                    href={`/explorer/accounts/${account.owner}`}
                    className="text-purple-600 dark:text-cyan-400 hover:underline"
                  >
                    {account.owner}
                  </Link>
                </div>
                <div className="col-span-4 text-right font-mono text-slate-700 dark:text-slate-300">
                  {(account.staked / 10000).toFixed(4)} FO
                </div>
                <div className="col-span-3 text-right font-mono text-slate-500 dark:text-slate-400">
                  {(parseFloat(account.last_vote_weight) / 10000).toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && accounts.length > 0 && (
          <div className="p-4 border-t border-slate-200/50 dark:border-white/10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  加载中...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  加载更多
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Collapsible>
  )
}
