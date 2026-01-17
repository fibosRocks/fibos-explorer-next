'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Vote, Users, TrendingUp, Search, CheckSquare, Square, AlertCircle, UserCheck, ArrowRight, Loader2 } from 'lucide-react'
import { TransactionSuccess } from '@/components/features/TransactionSuccess'
import { cn } from '@/lib/utils'
import * as eosClient from '@/lib/services/eos-client'
import type { Producer } from '@/lib/services/types'
import { useWalletStore } from '@/stores/walletStore'
import { useTranslation } from '@/lib/i18n'

/**
 * 投票页面
 *
 * 数据来源 (参考老项目 voting/voting.component.ts):
 * - eos.getGlobalState() -> total_producer_vote_weight
 * - eos.getProducers() -> 节点列表
 * - eos.getAccount(account_name) -> voter_info.producers (已投票节点), voter_info.staked
 */

// 配置: 推荐的投票代理人账户
const RECOMMENDED_PROXY = 'rockrockrock'

// 无效的公钥 (已注销节点)
const INVALID_PRODUCER_KEY = 'FO1111111111111111111111111111111114T1Anm'

// 计算得票率
function getVotePercent(total_votes: string, total_weight: string): string {
  const votes = parseFloat(total_votes)
  const weight = parseFloat(total_weight)
  if (weight === 0) return '0.00'
  return ((votes / weight) * 100).toFixed(2)
}

interface ProducerWithRank extends Producer {
  rank: number
}

export default function VotingPage() {
  // i18n
  const { t } = useTranslation()

  // 钱包状态
  const { connected, account, accountInfo, accountStatus, connect, connecting, transact, getPermission } = useWalletStore()

  // 数据状态
  const [producers, setProducers] = useState<ProducerWithRank[]>([])
  const [totalWeight, setTotalWeight] = useState<string>('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 搜索关键词
  const [keywords, setKeywords] = useState('')

  // 已选节点
  const [selectedProducers, setSelectedProducers] = useState<Set<string>>(new Set())

  // 投票中状态
  const [voting, setVoting] = useState(false)
  const [voteSuccess, setVoteSuccess] = useState<{ message: string; txId?: string } | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)

  // 代理设置状态
  const [proxyVoting, setProxyVoting] = useState(false)
  const [proxySuccess, setProxySuccess] = useState<{ message: string; txId?: string } | null>(null)
  const [proxyError, setProxyError] = useState<string | null>(null)

  // 计算抵押数量
  const staked = accountStatus?.staked || 0

  // 获取数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // 并行获取全局状态和节点列表
        const [globalState, producersData] = await Promise.all([
          eosClient.getGlobalState(),
          eosClient.getProducers(200),
        ])

        // 设置全局投票权重
        setTotalWeight(globalState?.total_producer_vote_weight || '0')

        // 过滤并排序节点
        const activeProducers = producersData.rows
          .filter(p => p.producer_key !== INVALID_PRODUCER_KEY)
          .sort((a, b) => parseFloat(b.total_votes) - parseFloat(a.total_votes))
          .map((p, index) => ({
            ...p,
            rank: index + 1,
          }))

        setProducers(activeProducers)
      } catch (err) {
        console.error('获取投票数据失败:', err)
        setError(t('voting.fetchError'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 当钱包连接后，加载已投票节点
  useEffect(() => {
    if (connected && accountInfo?.voter_info?.producers) {
      setSelectedProducers(new Set(accountInfo.voter_info.producers))
    }
  }, [connected, accountInfo])

  // 过滤节点列表
  const filteredProducers = producers.filter((producer) =>
    producer.owner.toLowerCase().includes(keywords.toLowerCase())
  )

  // 切换节点选中状态
  const toggleProducer = (owner: string, isActive: number) => {
    if (!isActive) {
      // 已注销节点不能选择
      return
    }

    const newSelected = new Set(selectedProducers)
    if (newSelected.has(owner)) {
      newSelected.delete(owner)
    } else {
      // 最多选择 30 个
      if (newSelected.size >= 30) {
        return
      }
      newSelected.add(owner)
    }
    setSelectedProducers(newSelected)
  }

  // 全选前 21 个
  const selectTop21 = () => {
    const top21 = producers
      .filter((p) => p.is_active)
      .slice(0, 21)
      .map((p) => p.owner)
    setSelectedProducers(new Set(top21))
  }

  // 清空选择
  const clearSelection = () => {
    setSelectedProducers(new Set())
  }

  // 执行投票
  const handleVote = async () => {
    if (!connected || !account) {
      setVoteError(t('voting.errorConnectFirst'))
      return
    }

    if (selectedProducers.size === 0) {
      setVoteError(t('voting.errorSelectNode'))
      return
    }

    const permission = getPermission()
    if (!permission) {
      setVoteError(t('voting.errorNoPermission'))
      return
    }

    setVoting(true)
    setVoteError(null)
    setVoteSuccess(null)

    try {
      // 节点名需要按字母顺序排序
      const sortedProducers = Array.from(selectedProducers).sort()

      const result = await transact([{
        account: 'eosio',
        name: 'voteproducer',
        authorization: [permission],
        data: {
          voter: account.name,
          proxy: '',
          producers: sortedProducers,
        },
      }])

      setVoteSuccess({
        message: t('success.vote'),
        txId: result.transaction_id
      })
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : t('voting.errorVoteFailed'))
    } finally {
      setVoting(false)
    }
  }

  // 设置投票代理
  const handleSetProxy = async () => {
    if (!connected || !account) {
      connect()
      return
    }

    const permission = getPermission()
    if (!permission) {
      setProxyError(t('voting.errorNoPermission'))
      return
    }

    setProxyVoting(true)
    setProxyError(null)
    setProxySuccess(null)

    try {
      const result = await transact([{
        account: 'eosio',
        name: 'voteproducer',
        authorization: [permission],
        data: {
          voter: account.name,
          proxy: RECOMMENDED_PROXY,
          producers: [],
        },
      }])

      setProxySuccess({
        message: t('success.proxy'),
        txId: result.transaction_id
      })

      // 清空本地选择，避免 UI 混淆
      setSelectedProducers(new Set())
    } catch (err) {
      setProxyError(err instanceof Error ? err.message : t('voting.errorProxyFailed'))
    } finally {
      setProxyVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p>{t('nodes.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('voting.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('voting.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Producers */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('voting.activeProducers')}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {Math.min(producers.filter(p => p.is_active).length, 21)}
          </div>
          <div className="text-sm text-slate-400 mt-1">{t('voting.activeProducersCount')}</div>
        </div>

        {/* My Staked */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('voting.myStake')}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {connected ? `${staked.toFixed(4)} FO` : '0 FO'}
          </div>
          <div className="text-sm text-slate-400 mt-1">{t('voting.stakeForVote')}</div>
        </div>

        {/* My Voted Producers */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Vote className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('voting.selectedCount')}</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {selectedProducers.size}
          </div>
          <div className="text-sm text-slate-400 mt-1">{t('voting.maxVoteCount')}</div>
        </div>
      </div>

      {/* Proxy Voting Recommendation */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('voting.useProxy')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {t('voting.useProxyDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('voting.recommendedProxy')}</div>
              <Link
                href={`/explorer/accounts/${RECOMMENDED_PROXY}`}
                className="font-mono text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                {RECOMMENDED_PROXY}
              </Link>
            </div>
            <button
              onClick={handleSetProxy}
              disabled={proxyVoting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
            >
              {proxyVoting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t('voting.setAsProxy')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
        {proxyError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {proxyError}
          </div>
        )}
        {proxySuccess && (
          <TransactionSuccess
            message={proxySuccess.message}
            txId={proxySuccess.txId}
            className="mt-4 bg-emerald-500/10 border-emerald-500/20"
          />
        )}
        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('voting.proxyInfoText')}
          </p>
        </div>
      </div>

      {/* Selected Producers Summary */}
      {selectedProducers.size > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {t('voting.selectedXNodes').replace('{count}', String(selectedProducers.size))}
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              {t('voting.clearSelection')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedProducers).map((owner) => (
              <span
                key={owner}
                className="px-2 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded text-xs font-mono"
              >
                {owner}
              </span>
            ))}
          </div>
          {/* Vote Error/Success */}
          {voteError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {voteError}
            </div>
          )}
          {voteSuccess && (
            <TransactionSuccess
              message={voteSuccess.message}
              txId={voteSuccess.txId}
              className="mt-4 bg-emerald-500/10 border-emerald-500/20"
            />
          )}

          {/* Vote Button */}
          <div className="mt-4 pt-4 border-t border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle className="w-4 h-4" />
              <span>{connected ? t('voting.selectThenVote') : t('voting.needWallet')}</span>
            </div>
            <button
              onClick={handleVote}
              disabled={selectedProducers.size === 0 || voting || !connected}
              className={cn(
                'px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all',
                selectedProducers.size > 0 && connected
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
            >
              {voting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Vote className="w-4 h-4" />
              )}
              {t('voting.confirmVote')} ({selectedProducers.size})
            </button>
          </div>
        </div>
      )}

      {/* Producers List */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        {/* Header with Search */}
        <div className="p-4 border-b border-slate-200/50 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('voting.producerList')}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {t('voting.totalProducers').replace('{count}', String(producers.length))}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={selectTop21}
                className="px-3 py-1.5 text-xs font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors"
              >
                {t('voting.selectTop21')}
              </button>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder={t('voting.searchProducer')}
                  className="h-8 pl-9 pr-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="col-span-1"></div>
          <div className="col-span-1">{t('nodes.rank')}</div>
          <div className="col-span-4">{t('voting.nodeName')}</div>
          <div className="col-span-3">{t('voting.voteWeight')}</div>
          <div className="col-span-2">{t('nodes.votePercent')}</div>
          <div className="col-span-1">{t('nodes.status')}</div>
        </div>

        {/* Producers */}
        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {filteredProducers.map((producer) => {
            const isChecked = selectedProducers.has(producer.owner)
            const votePercent = getVotePercent(producer.total_votes, totalWeight)
            const isActive = producer.is_active === 1

            return (
              <div
                key={producer.owner}
                onClick={() => toggleProducer(producer.owner, producer.is_active)}
                className={cn(
                  'grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 cursor-pointer transition-colors items-center',
                  isChecked
                    ? 'bg-purple-500/5 hover:bg-purple-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5',
                  !isActive && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Checkbox */}
                <div className="sm:col-span-1 flex items-center">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-purple-500" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                {/* Rank */}
                <div className="sm:col-span-1">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs',
                      producer.rank <= 3
                        ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white'
                        : producer.rank <= 21
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {producer.rank}
                  </div>
                </div>

                {/* Owner */}
                <div className="sm:col-span-4">
                  <Link
                    href={`/explorer/accounts/${producer.owner}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-sm text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-cyan-400"
                  >
                    {producer.owner}
                  </Link>
                </div>

                {/* Votes */}
                <div className="sm:col-span-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                  {parseFloat(producer.total_votes).toExponential(4)}
                </div>

                {/* Vote Percent */}
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(parseFloat(votePercent) * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">
                      {votePercent}%
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="sm:col-span-1">
                  {producer.rank <= 21 && isActive ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {t('voting.producing')}
                    </span>
                  ) : !isActive ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500">
                      {t('voting.inactive')}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
                      {t('voting.candidate')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Connect Wallet Prompt */}
      {!connected && (
        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20 p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('voting.connectForVote')}</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{t('voting.connectForVoteDesc')}</p>
          <button
            onClick={() => connect()}
            disabled={connecting}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {connecting ? t('common.connecting') : t('common.connect')}
          </button>
        </div>
      )}
    </div>
  )
}
