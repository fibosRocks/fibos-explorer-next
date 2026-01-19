'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Box, Clock, Hash, User, Layers, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import * as eos from '@/lib/services/eos'
import type { Block } from '@/lib/services/types'
import { useTranslation } from '@/lib/i18n'

export default function BlockPage() {
  const { t } = useTranslation()
  const params = useParams()
  const id = params.id as string

  const [block, setBlock] = useState<Block | null>(null)
  const [chainInfo, setChainInfo] = useState<{ last_irreversible_block_num: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const [blockData, info] = await Promise.all([
          eos.getBlock(id),
          eos.getInfo(),
        ])
        setBlock(blockData)
        setChainInfo(info)
      } catch (err) {
        console.error('获取区块数据失败:', err)
        setError(t('block.fetchError'))
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error || !block) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Box className="w-12 h-12 mb-4 text-slate-300" />
        <p>{error || t('block.notFound')}</p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          {t('common.backHome')}
        </Link>
      </div>
    )
  }

  const isPending = chainInfo
    ? block.block_num > chainInfo.last_irreversible_block_num
    : false

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp + 'Z').toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Box className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('block.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Block #{block.block_num.toLocaleString()}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            {t('block.pendingStatus')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            {t('block.irreversible')}
          </span>
        )}
      </div>

      {/* Block Info Card */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('block.title')}</h2>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {/* Block Number */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400">
              <Hash className="w-4 h-4" />
              {t('block.blockNumber')}
            </div>
            <div className="font-mono text-slate-900 dark:text-white">
              {block.block_num.toLocaleString()}
            </div>
          </div>

          {/* Block ID */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <Hash className="w-4 h-4" />
              {t('block.blockHash')}
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white break-all">
              {block.id}
            </div>
          </div>

          {/* Timestamp */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              {t('block.timestamp')}
            </div>
            <div className="text-slate-900 dark:text-white">
              {formatTime(block.timestamp)}
            </div>
          </div>

          {/* Producer */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400">
              <User className="w-4 h-4" />
              {t('block.producer')}
            </div>
            <Link
              href={`/explorer/accounts/${block.producer}`}
              className="font-mono text-purple-600 dark:text-cyan-400 hover:underline"
            >
              {block.producer}
            </Link>
          </div>

          {/* Previous Block */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <Layers className="w-4 h-4" />
              {t('block.previousBlock')}
            </div>
            <Link
              href={`/explorer/blocks/${block.block_num - 1}`}
              className="font-mono text-sm text-purple-600 dark:text-cyan-400 hover:underline break-all"
            >
              {block.previous}
            </Link>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('block.transactions')}
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t('common.total')} {block.transactions.length} {t('common.transactions')}
          </span>
        </div>

        {block.transactions.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="col-span-1">#</div>
              <div className="col-span-9">{t('transaction.txId')}</div>
              <div className="col-span-2">{t('transaction.status')}</div>
            </div>

            <div className="divide-y divide-slate-200/50 dark:divide-white/10">
              {block.transactions.map((tx, index) => {
                // 处理交易数据：可能是字符串（tx id）或对象
                const txId = typeof tx.trx === 'string' ? tx.trx : (tx.trx as { id: string })?.id || '-'

                return (
                  <Link
                    key={index}
                    href={`/explorer/transactions/${txId}`}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors items-center"
                  >
                    {/* Index */}
                    <div className="sm:col-span-1 text-xs text-slate-400">
                      {index + 1}
                    </div>
                    {/* TX ID */}
                    <div className="sm:col-span-9 font-mono text-sm text-purple-600 dark:text-cyan-400 truncate">
                      {txId}
                    </div>
                    {/* Status */}
                    <div className="sm:col-span-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {tx.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-400">
            {t('block.noTransactions')}
          </div>
        )}
      </div>

      {/* Merkle Roots */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Merkle Roots</h2>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Transaction Merkle Root</div>
            <div className="font-mono text-xs text-slate-900 dark:text-white break-all bg-slate-100 dark:bg-slate-800 p-2 rounded">
              {block.transaction_mroot}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Action Merkle Root</div>
            <div className="font-mono text-xs text-slate-900 dark:text-white break-all bg-slate-100 dark:bg-slate-800 p-2 rounded">
              {block.action_mroot}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
