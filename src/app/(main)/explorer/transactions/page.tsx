'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRightLeft, Clock, Hash, Box, User, FileCode, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import * as eos from '@/lib/services/eos'
import type { Action, TransactionActionTrace } from '@/lib/services/types'
import { useTranslation } from '@/lib/i18n'

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

function TransactionContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''

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
              href={`/explorer/blocks?id=${transaction.block_num}`}
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
              <div key={index} className="p-4">
                {/* Action Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{action.name}</span>
                      <span className="text-slate-400">@</span>
                      <Link
                        href={`/explorer/accounts?id=${action.account}`}
                        className="font-mono text-purple-600 dark:text-cyan-400 hover:underline"
                      >
                        {action.account}
                      </Link>
                    </div>
                    <div className="text-xs text-slate-400">
                      Action #{index + 1}
                    </div>
                  </div>
                </div>

                {/* Authorization */}
                {action.authorization && action.authorization.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {t('transaction.authorization')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {action.authorization.map((auth, authIndex) => (
                        <Link
                          key={authIndex}
                          href={`/explorer/accounts?id=${auth.actor}`}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {auth.actor}@{auth.permission}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data */}
                {action.data && (
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('transaction.data')}</div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                        {JSON.stringify(action.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
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
              <div key={index} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{action.name}</span>
                    <span className="text-slate-400">@</span>
                    <Link
                      href={`/explorer/accounts?id=${action.account}`}
                      className="font-mono text-sm text-purple-600 dark:text-cyan-400 hover:underline"
                    >
                      {action.account}
                    </Link>
                  </div>
                </div>
                {action.data && (
                  <div className="ml-11">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                        {JSON.stringify(action.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TransactionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
      <TransactionContent />
    </Suspense>
  )
}
