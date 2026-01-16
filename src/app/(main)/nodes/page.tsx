'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Monitor, HardDrive, CheckCircle, Clock, Loader2, Zap } from 'lucide-react'
import * as eosClient from '@/lib/services/eos-client'
import type { ChainInfo, Producer, BpStatus } from '@/lib/services/types'
import { cn } from '@/lib/utils'

interface NodeWithStatus extends Producer {
  rank: number
  isBad: boolean
  lastBlockTime?: string
  votePercent: string
}

function StatusBadge({ isBad, rank, isProducing }: { isBad: boolean; rank: number; isProducing: boolean }) {
  if (isProducing) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500 text-white animate-pulse">
        正在出块
      </span>
    )
  }

  if (rank > 21) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
        候选
      </span>
    )
  }

  if (isBad) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
        异常
      </span>
    )
  }

  return (
    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      出块中
    </span>
  )
}

export default function NodesPage() {
  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null)
  const [producers, setProducers] = useState<Producer[]>([])
  const [bpStatusMap, setBpStatusMap] = useState<Map<string, BpStatus>>(new Map())

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. 获取链数据（快速，核心）
  const fetchChainData = useCallback(async () => {
    try {
      const [info, producersResult] = await Promise.all([
        eosClient.getInfo(),
        eosClient.getProducers(50),
      ])

      setChainInfo(info)
      setProducers(producersResult.rows)
      setError(null)
    } catch (err) {
      console.error('获取节点数据失败:', err)
      // 只有在没有数据时才显示错误
      setProducers(prev => {
        if (prev.length === 0) {
             setError('获取数据失败，请稍后重试')
        }
        return prev
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. 获取 BP 状态（较慢，补充信息，不阻塞）
  const fetchBpStatus = useCallback(async () => {
    try {
      const bpStatusResult = await eosClient.getBpStatus()
      const map = new Map<string, BpStatus>()
      bpStatusResult.rows2?.forEach((bp) => {
        map.set(bp.bpname, bp)
      })
      setBpStatusMap(map)
    } catch (err) {
      console.warn('获取 BP 状态失败:', err)
      // 失败不影响主流程，仅不更新状态
    }
  }, [])

  useEffect(() => {
    fetchChainData()
    fetchBpStatus()

    const chainInterval = setInterval(fetchChainData, 3000)
    const statusInterval = setInterval(fetchBpStatus, 10000) // BP 状态更新频率稍低

    return () => {
      clearInterval(chainInterval)
      clearInterval(statusInterval)
    }
  }, [fetchChainData, fetchBpStatus])

  // 计算节点状态
  const nodes = useMemo(() => {
    if (producers.length === 0) return []

    // 1. 先按票数排序获取排名
    const sortedByVotes = [...producers]
      .filter((p) => p.is_active)
      .sort((a, b) => parseFloat(b.total_votes) - parseFloat(a.total_votes))

    // 2. 计算总投票权重
    const totalVotes = sortedByVotes.reduce((sum, p) => sum + parseFloat(p.total_votes), 0)

    // 3. 判断异常的时间阈值（5分钟没出块视为异常）
    const BAD_THRESHOLD_MS = 5 * 60 * 1000
    const now = Date.now()

    // 4. 构建带状态的节点列表
    return sortedByVotes.map((producer, index) => {
      const bpStatus = bpStatusMap.get(producer.owner)

      // 判断节点是否异常
      let isBad = false
      if (bpStatus?.date) {
        const lastBlockTime = new Date(bpStatus.date).getTime()
        isBad = (now - lastBlockTime) > BAD_THRESHOLD_MS
      } else if (bpStatus && !bpStatus.date) {
        // date 为 null 表示从未出块或异常
        isBad = true
      }
      // 如果没有获取到 bpStatus，默认为正常 (false)，避免一开始全红

      // 计算得票率
      const votes = parseFloat(producer.total_votes)
      const votePercent = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(2) : '0.00'

      return {
        ...producer,
        rank: index + 1,
        isBad,
        lastBlockTime: bpStatus?.date || undefined,
        votePercent,
      } as NodeWithStatus
    })
  }, [producers, bpStatusMap])

  // 统计健康节点数
  const healthyProducers = nodes.filter((n) => n.rank <= 21 && !n.isBad).length

  // 出块节点（前21）按字母排序
  const activeProducers = nodes
    .filter((n) => n.rank <= 21)
    .sort((a, b) => a.owner.localeCompare(b.owner))

  // 候选节点（22-26）
  const standbyProducers = nodes.filter((n) => n.rank > 21 && n.rank <= 26)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <p>{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">节点监控</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">实时监控 FIBOS 网络节点状态</p>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Healthy Producers */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">健康节点</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{healthyProducers} / 21</div>
        </div>

        {/* Head Block */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">最新区块</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {chainInfo?.head_block_num.toLocaleString()}
          </div>
        </div>

        {/* LIB */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">不可逆区块</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {chainInfo?.last_irreversible_block_num.toLocaleString()}
          </div>
        </div>

        {/* Current Producer */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center animate-pulse">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-emerald-700 dark:text-emerald-300">当前出块</span>
          </div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 truncate">
            {chainInfo?.head_block_producer}
          </div>
        </div>
      </div>

      {/* Active Producers Table */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            出块节点
            <span className="ml-2 text-sm font-normal text-slate-400">(按字母排序)</span>
          </h2>
          <div className="text-sm text-slate-400">
            版本: {chainInfo?.server_version_string}
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">排名</div>
          <div className="col-span-4">节点名称</div>
          <div className="col-span-3">状态</div>
          <div className="col-span-4">得票率</div>
        </div>

        {/* Table Body - Active Producers */}
        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {activeProducers.map((node) => {
            const isProducing = node.owner === chainInfo?.head_block_producer

            return (
              <div
                key={node.owner}
                className={cn(
                  'grid grid-cols-1 md:grid-cols-12 gap-4 p-5 transition-all',
                  isProducing
                    ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-l-4 border-emerald-500'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                )}
              >
                {/* Rank */}
                <div className="md:col-span-1 flex items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                    node.rank <= 3
                      ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  )}>
                    {node.rank}
                  </div>
                </div>

                {/* Node Name */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    isProducing
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}>
                    {isProducing ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : (
                      <Monitor className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className={cn(
                      'font-medium',
                      isProducing
                        ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-slate-900 dark:text-white'
                    )}>
                      <Link href={`/explorer/accounts/${node.owner}`} className="hover:underline">
                        {node.owner}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="md:col-span-3 flex items-center">
                  <StatusBadge isBad={node.isBad} rank={node.rank} isProducing={isProducing} />
                </div>

                {/* Vote Percent */}
                <div className="md:col-span-4 flex items-center gap-2">
                  <div className="flex-1 max-w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min(parseFloat(node.votePercent) * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-mono w-16">
                    {node.votePercent}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Standby Producers */}
      {standbyProducers.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              候选节点
              <span className="ml-2 text-sm font-normal text-slate-400">(Top 5)</span>
            </h2>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-1">排名</div>
            <div className="col-span-4">节点名称</div>
            <div className="col-span-3">状态</div>
            <div className="col-span-4">得票率</div>
          </div>

          {/* Table Body - Standby Producers */}
          <div className="divide-y divide-slate-200/50 dark:divide-white/10">
            {standbyProducers.map((node) => (
              <div
                key={node.owner}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors opacity-75"
              >
                {/* Rank */}
                <div className="md:col-span-1 flex items-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    {node.rank}
                  </div>
                </div>

                {/* Node Name */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="font-medium text-slate-600 dark:text-slate-400">
                    <Link href={`/explorer/accounts/${node.owner}`} className="hover:underline hover:text-purple-600 dark:hover:text-cyan-400">
                      {node.owner}
                    </Link>
                  </div>
                </div>

                {/* Status */}
                <div className="md:col-span-3 flex items-center">
                  <StatusBadge isBad={node.isBad} rank={node.rank} isProducing={false} />
                </div>

                {/* Vote Percent */}
                <div className="md:col-span-4 flex items-center gap-2">
                  <div className="flex-1 max-w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${Math.min(parseFloat(node.votePercent) * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono w-16">
                    {node.votePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span>正在出块 - 当前正在生产区块的节点</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>出块中 - 节点正常</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>异常 - 超过5分钟未出块</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500" />
          <span>候选 - 排名 21 以后的备选节点</span>
        </div>
      </div>
    </div>
  )
}
