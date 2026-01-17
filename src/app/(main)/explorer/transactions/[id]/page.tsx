import Link from 'next/link'
import { ArrowRightLeft, Clock, Hash, Box, User, FileCode, CheckCircle, AlertCircle } from 'lucide-react'
import * as eos from '@/lib/services/eos'
import type { Action, TransactionActionTrace } from '@/lib/services/types'

export const runtime = 'edge'

/**
 * 交易详情页面
 *
 * 数据来源 (参考老项目 transaction/transaction.component.ts):
 * - eosService.filter.getTransaction(id) -> 交易详情
 * - eosService.eos.getInfo() -> 链信息 (用于判断确认状态)
 */

interface PageProps {
  params: Promise<{ id: string }>
}

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

export default async function TransactionPage({ params }: PageProps) {
  const { id } = await params

  let transaction: {
    id: string
    block_num: number
    block_time: string
    status: 'Irreversible' | 'Pending'
  } | null = null
  let actions: Action[] = []
  let inlineActions: Action[] = []
  let error: string | null = null

  try {
    // 并行获取交易数据和链信息
    const [txData, chainInfo] = await Promise.all([
      eos.getTransaction(id),
      eos.getInfo(),
    ])

    const txId = txData.id || txData.trx_id || id
    const blockNum = txData.block_num
    const blockTime = txData.block_time

    // 判断确认状态
    const lib = txData.last_irreversible_block || chainInfo.last_irreversible_block_num
    const isIrreversible = blockNum < lib

    transaction = {
      id: txId,
      block_num: blockNum,
      block_time: blockTime,
      status: isIrreversible ? 'Irreversible' : 'Pending',
    }

    // FIBOS 使用 action_traces
    if (txData.action_traces && txData.action_traces.length > 0) {
      actions = txData.action_traces.map(trace => trace.act)
      inlineActions = extractInlineActions(txData.action_traces)
    } else if (txData.trx?.trx?.actions) {
      // 非 FIBOS 链使用 trx.trx.actions
      actions = txData.trx.trx.actions
      if (txData.traces) {
        inlineActions = extractInlineActions(txData.traces)
      }
    }
  } catch (err) {
    console.error('获取交易数据失败:', err)
    error = '交易不存在或获取数据失败'
  }

  if (error || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <ArrowRightLeft className="w-12 h-12 mb-4 text-slate-300" />
        <p>{error || '交易不存在'}</p>
        <p className="text-sm text-slate-400 mt-2 font-mono break-all max-w-lg text-center">
          {id}
        </p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          返回首页
        </Link>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">交易详情</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Transaction Details</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {isIrreversible ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            已确认 (Irreversible)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            待确认 (Pending)
          </span>
        )}
      </div>

      {/* Transaction Info Card */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {/* Transaction ID */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center gap-2 w-32 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <Hash className="w-4 h-4" />
              交易 ID
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white break-all">
              {transaction.id}
            </div>
          </div>

          {/* Block Number */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-32 text-sm text-slate-500 dark:text-slate-400">
              <Box className="w-4 h-4" />
              区块号
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
              时间戳
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Actions</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              共 {actions.length} 个
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
                        href={`/explorer/accounts/${action.account}`}
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
                      授权
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {action.authorization.map((auth, authIndex) => (
                        <Link
                          key={authIndex}
                          href={`/explorer/accounts/${auth.actor}`}
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
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">数据</div>
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inline Actions</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              共 {inlineActions.length - actions.length} 个
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
                      href={`/explorer/accounts/${action.account}`}
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
