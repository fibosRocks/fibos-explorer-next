import Link from 'next/link'
import { Box, Clock, Hash, User, Layers, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * 区块详情页面
 *
 * 数据来源 (参考老项目 block/block.component.ts):
 * - eosService.eos.getBlock(id) -> 区块详情
 *   - block_num: 区块号
 *   - id: 区块哈希
 *   - timestamp: 时间戳
 *   - producer: 出块节点
 *   - previous: 上一个区块哈希
 *   - transaction_mroot: 交易默克尔根
 *   - action_mroot: Action 默克尔根
 *   - transactions: 交易列表 [{trx: {id, transaction: {actions}}, status}]
 *
 * - eosService.eos.getInfo() -> 链信息
 *   - last_irreversible_block_num: 不可逆区块号 (判断 pending 状态)
 *
 * 状态判断: block_num > last_irreversible_block_num ? "Pending" : "Irreversible"
 */

interface PageProps {
  params: Promise<{ id: string }>
}

// 模拟数据 - 实际数据来自 getBlock()
const mockBlock = {
  block_num: 123456789,
  id: '0075bcd15abc123def456789abcdef123456789abcdef123456789abcdef1234',
  timestamp: '2024-01-15T10:30:00.000',
  producer: 'fibosgenesis',
  previous: '0075bcd14abc123def456789abcdef123456789abcdef123456789abcdef1234',
  transaction_mroot: '0000000000000000000000000000000000000000000000000000000000000000',
  action_mroot: '0000000000000000000000000000000000000000000000000000000000000000',
  transactions: [
    { trx: { id: 'abc123...def456', transaction: { actions: [{}, {}] } }, status: 'executed' },
    { trx: { id: 'xyz789...uvw012', transaction: { actions: [{}] } }, status: 'executed' },
  ],
}

// 模拟链信息 - 来自 getInfo()
const mockInfo = {
  last_irreversible_block_num: 123456750,
}

export default async function BlockPage({ params }: PageProps) {
  const { id } = await params
  const block = mockBlock
  const isPending = block.block_num > mockInfo.last_irreversible_block_num

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Box className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">区块详情</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Block #{id}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {isPending ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            待确认 (Pending)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            已确认 (Irreversible)
          </span>
        )}
      </div>

      {/* Block Info Card */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">基本信息</h2>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {/* Block Number */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400">
              <Hash className="w-4 h-4" />
              区块号
            </div>
            <div className="font-mono text-slate-900 dark:text-white">
              {block.block_num.toLocaleString()}
            </div>
          </div>

          {/* Block ID - 来自 getBlock().id */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <Hash className="w-4 h-4" />
              区块哈希
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white break-all">
              {block.id}
            </div>
          </div>

          {/* Timestamp - 来自 getBlock().timestamp */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              时间戳
            </div>
            <div className="text-slate-900 dark:text-white">
              {block.timestamp}
            </div>
          </div>

          {/* Producer - 来自 getBlock().producer */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400">
              <User className="w-4 h-4" />
              出块节点
            </div>
            <Link
              href={`/explorer/accounts/${block.producer}`}
              className="font-mono text-purple-600 dark:text-cyan-400 hover:underline"
            >
              {block.producer}
            </Link>
          </div>

          {/* Previous Block - 来自 getBlock().previous */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center gap-2 w-40 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              <Layers className="w-4 h-4" />
              上一区块
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

      {/* Transactions - 来自 getBlock().transactions */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            交易列表
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            共 {block.transactions.length} 笔
          </span>
        </div>

        {block.transactions.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="col-span-1">#</div>
              <div className="col-span-7">交易 ID</div>
              <div className="col-span-2">Actions</div>
              <div className="col-span-2">状态</div>
            </div>

            <div className="divide-y divide-slate-200/50 dark:divide-white/10">
              {block.transactions.map((tx, index) => (
                <Link
                  key={index}
                  href={`/explorer/transactions/${tx.trx.id}`}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors items-center"
                >
                  {/* Index */}
                  <div className="sm:col-span-1 text-xs text-slate-400">
                    {index + 1}
                  </div>
                  {/* TX ID */}
                  <div className="sm:col-span-7 font-mono text-sm text-purple-600 dark:text-cyan-400 truncate">
                    {tx.trx.id}
                  </div>
                  {/* Actions Count */}
                  <div className="sm:col-span-2 text-xs text-slate-600 dark:text-slate-300">
                    {tx.trx.transaction.actions.length} 个
                  </div>
                  {/* Status */}
                  <div className="sm:col-span-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {tx.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-400">
            该区块没有交易
          </div>
        )}
      </div>

      {/* Raw Data - 来自 getBlock() 原始返回 */}
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
