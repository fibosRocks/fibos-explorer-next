'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRightLeft, Clock, Hash, Box, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import * as eos from '@/lib/services/eos'
import type { Action, TransactionActionTrace } from '@/lib/services/types'
import { useTranslation } from '@/lib/i18n'
import { ActionCardDetail } from '@/components/features/action-card'

/**
 * 交易详情页面
 *
 * 数据来源 (参考老项目 transaction/transaction.component.ts):
 * - eosService.filter.getTransaction(id) -> 交易详情
 * - eosService.eos.getInfo() -> 链信息 (用于判断确认状态)
 */

// 递归提取 inline actions
function extractInlineActions(traces: TransactionActionTrace[]): Action[] {
  const actions: Action[] = []
  const resolveInlineAction = (traceList: TransactionActionTrace[]) => {
    traceList.forEach(trace => {
      actions.push(trace.act)
      if (trace.inline_traces && trace.inline_traces.length > 0) {
        resolveInlineAction(trace.inline_traces)
      }
    })
  }
  resolveInlineAction(traces)
  return actions
}

export default function TransactionPage() {
  const { t } = useTranslation()
  const params = useParams()
  const id = params.id as string

  const [transaction, setTransaction] = useState<{
    id: string
    block_num: number
    block_time: string
    status: 'Irreversible' | 'Pending'
  } | null>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [inlineActions, setInlineActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [txData, chainInfo] = await Promise.all([
        eos.getTransaction(id),
        eos.getInfo(),
      ])

      const txId = txData.id || txData.trx_id || id
      const blockNum = txData.block_num
      const blockTime = txData.block_time

      const lib = txData.last_irreversible_block || chainInfo.last_irreversible_block_num
      const isIrreversible = blockNum < lib

      setTransaction({
        id: txId,
        block_num: blockNum,
        block_time: blockTime,
        status: isIrreversible ? 'Irreversible' : 'Pending',
      })

      // FIBOS 使用 action_traces
      if (txData.action_traces && txData.action_traces.length > 0) {
        setActions(txData.action_traces.map(trace => trace.act))
        setInlineActions(extractInlineActions(txData.action_traces))
      } else if (txData.trx?.trx?.actions) {
        setActions(txData.trx.trx.actions)
        if (txData.traces) {
          setInlineActions(extractInlineActions(txData.traces))
        }
      }
    } catch (err) {
      console.error('获取交易数据失败:', err)
      setError(t('transaction.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <ArrowRightLeft className="w-12 h-12 mb-4 text-slate-300" />
        <p>{error || t('transaction.notFound')}</p>
        <p className="text-sm text-slate-400 mt-2 font-mono break-all max-w-lg text-center">
          {id}
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.retry')}
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            {t('common.backHome')}
          </Link>
        </div>
      </div>
    )
  }

  const isIrreversible = transaction.status === 'Irreversible'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <ArrowRightLeft className="w-7 h-7 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('transaction.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Transaction Details</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {isIrreversible ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            {t('block.irreversible')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            {t('block.pendingStatus')}
          </span>
        )}
      </div>

      {/* Transaction Info Card */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('transaction.basicInfo')}</h2>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {/* Transaction ID */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center gap-2 w-32 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <Hash className="w-4 h-4" />
              {t('transaction.txId')}
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white break-all">
              {transaction.id}
            </div>
          </div>

          {/* Block Number */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-32 text-sm text-slate-500 dark:text-slate-400">
              <Box className="w-4 h-4" />
              {t('transaction.blockNumber')}
            </div>
            <Link
              href={`/explorer/blocks/${transaction.block_num}`}
              className="font-mono text-purple-600 dark:text-cyan-400 hover:underline"
            >
              {transaction.block_num.toLocaleString()}
            </Link>
          </div>

          {/* Timestamp */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-32 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              {t('transaction.timestamp')}
            </div>
            <div className="text-slate-900 dark:text-white">
              {transaction.block_time}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('transaction.actions')}</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('transaction.actionsCount').replace('{count}', String(actions.length))}
            </span>
          </div>

          <div className="divide-y divide-slate-200/50 dark:divide-white/10">
            {actions.map((action, index) => (
              <ActionCardDetail key={index} action={action} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Inline Actions */}
      {inlineActions.length > actions.length && (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('transaction.inlineActions')}</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('transaction.actionsCount').replace('{count}', String(inlineActions.length - actions.length))}
            </span>
          </div>

          <div className="divide-y divide-slate-200/50 dark:divide-white/10">
            {inlineActions.slice(actions.length).map((action, index) => (
              <ActionCardDetail key={index} action={action} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
