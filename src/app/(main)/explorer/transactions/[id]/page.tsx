import Link from 'next/link'
import { ArrowRightLeft, Clock, Hash, Box, User, FileCode, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * 交易详情页面
 *
 * 数据来源 (参考老项目 transaction/transaction.component.ts):
 *
 * 1. eosService.filter.getTransaction(id) -> 交易详情
 *    - id / trx_id: 交易 ID
 *    - block_num: 所在区块号
 *    - block_time: 区块时间
 *    - trx.trx.actions: Actions 列表 (非 FIBOS)
 *    - action_traces: Action 追踪 (FIBOS)
 *    - traces: 所有 trace (用于提取 inline actions)
 *
 * 2. eosService.eos.getInfo() -> 链信息
 *    - last_irreversible_block_num: 不可逆区块号
 *
 * 3. 状态判断:
 *    - block_num < last_irreversible_block_num ? "Irreversible" : "Pending"
 *
 * 4. Action 结构:
 *    - account: 合约账户
 *    - name: Action 名称
 *    - authorization: 授权列表 [{actor, permission}]
 *    - data: Action 数据
 */

interface PageProps {
  params: Promise<{ id: string }>
}

// 模拟数据 - 来自 getTransaction()
const mockTransaction = {
  id: 'abc123def456789ghijklmnopqrstuvwxyz0123456789abcdef0123456789abcd',
  block_num: 123456789,
  block_time: '2024-01-15T10:30:00.000',
  status: 'executed',
}

// 模拟链信息 - 来自 getInfo()
const mockInfo = {
  last_irreversible_block_num: 123456800,
}

// 模拟 Actions - 来自 trx.trx.actions 或 action_traces
const mockActions = [
  {
    account: 'eosio.token',
    name: 'transfer',
    authorization: [{ actor: 'fibosaccount', permission: 'active' }],
    data: {
      from: 'fibosaccount',
      to: 'otheruser123',
      quantity: '100.0000 FO',
      memo: 'Payment for services',
    },
  },
]

// 模拟 Inline Actions - 来自 traces
const mockInlineActions = [
  {
    account: 'eosio.token',
    name: 'transfer',
    authorization: [{ actor: 'eosio.token', permission: 'active' }],
    data: {
      from: 'fibosaccount',
      to: 'otheruser123',
      quantity: '100.0000 FO',
      memo: 'Payment for services',
    },
  },
]

export default async function TransactionPage({ params }: PageProps) {
  const { id } = await params
  const transaction = mockTransaction
  const isIrreversible = transaction.block_num < mockInfo.last_irreversible_block_num

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
        <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
          {transaction.status}
        </span>
      </div>

      {/* Transaction Info Card */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {/* Transaction ID - 来自 getTransaction().id */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center gap-2 w-32 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <Hash className="w-4 h-4" />
              交易 ID
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white break-all">
              {id}
            </div>
          </div>

          {/* Block Number - 来自 getTransaction().block_num */}
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

          {/* Timestamp - 来自 getTransaction().block_time */}
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

      {/* Actions - 来自 trx.trx.actions 或 action_traces */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Actions</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            共 {mockActions.length} 个
          </span>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {mockActions.map((action, index) => (
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

              {/* Authorization - 来自 action.authorization */}
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

              {/* Data - 来自 action.data */}
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">数据</div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                    {JSON.stringify(action.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline Actions - 来自 traces (去重后) */}
      {mockInlineActions.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inline Actions</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              共 {mockInlineActions.length} 个
            </span>
          </div>

          <div className="divide-y divide-slate-200/50 dark:divide-white/10">
            {mockInlineActions.map((action, index) => (
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
                <div className="ml-11">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                      {JSON.stringify(action.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
