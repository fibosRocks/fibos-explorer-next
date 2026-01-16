import Link from 'next/link'
import { User, Wallet, Cpu, HardDrive, Wifi, Clock, Vote, ArrowRight } from 'lucide-react'

/**
 * 账户详情页面
 *
 * 数据来源 (参考老项目 account/account.component.ts):
 *
 * 1. eosService.eos.getAccount(name) -> 账户基本信息
 *    - ram_usage, ram_quota: RAM 使用情况
 *    - cpu_limit.used, cpu_limit.max: CPU 使用情况 (微秒)
 *    - net_limit.used, net_limit.max: NET 使用情况 (字节)
 *    - voter_info.staked: 已抵押数量 (需 / 10000)
 *    - voter_info.producers: 已投票节点列表
 *    - voter_info.proxy: 代理账户
 *    - refund_request: 待赎回 (cpu_amount, net_amount)
 *    - self_delegated_bandwidth: 自己抵押的 (cpu_weight, net_weight)
 *    - total_resources: 总资源 (cpu_weight, net_weight)
 *    - core_liquid_balance: 可用余额 (非 FIBOS 链)
 *
 * 2. FIBOS 链特殊处理:
 *    - eosService.eos.getTableRows("eosio.token", account, "accounts") -> FO 余额
 *    - eosService.eos.getTableRows("eosio.token", account, "lockaccounts") -> 锁仓金额
 *
 * 3. 交易记录:
 *    - eosService.filter.getActions(name, pos, offset) -> 账户操作记录
 *    - eosService.eos.getInfo() -> last_irreversible_block_num (判断 pending)
 *
 * 4. 其他代币余额:
 *    - eosService.eos.getCurrencyBalance(contract, account, symbol)
 */

interface PageProps {
  params: Promise<{ id: string }>
}

// 模拟数据 - 来自 getAccount()
const mockAccount = {
  account_name: 'fibosaccount',
  ram_usage: 3456,
  ram_quota: 8192,
  cpu_limit: { used: 1234, max: 50000 },
  net_limit: { used: 456, max: 100000 },
  core_liquid_balance: '100.0000 FO',
  voter_info: {
    staked: 500000, // 实际值需要 / 10000 = 50.0000 FO
    producers: ['fibosgenesis', 'fibosbpnode1'],
    proxy: '',
  },
  refund_request: {
    cpu_amount: '10.0000 FO',
    net_amount: '10.0000 FO',
  },
  self_delegated_bandwidth: {
    cpu_weight: '25.0000 FO',
    net_weight: '25.0000 FO',
  },
  total_resources: {
    cpu_weight: '30.0000 FO',
    net_weight: '30.0000 FO',
  },
}

// 模拟操作记录 - 来自 getActions()
const mockActions = [
  {
    block_num: 123456789,
    block_time: '2024-01-15T10:30:00.000',
    transaction_id: 'abc123def456...',
    contract: 'eosio.token',
    name: 'transfer',
    data: { from: 'fibosaccount', to: 'otheruser123', quantity: '10.0000 FO', memo: 'test' },
  },
  {
    block_num: 123456780,
    block_time: '2024-01-15T10:25:00.000',
    transaction_id: 'xyz789uvw012...',
    contract: 'eosio',
    name: 'delegatebw',
    data: { from: 'fibosaccount', receiver: 'fibosaccount', stake_cpu_quantity: '5.0000 FO', stake_net_quantity: '5.0000 FO' },
  },
]

// 模拟代币余额 - 来自 getCurrencyBalance()
const mockTokens = [
  { symbol: 'FO', contract: 'eosio', balance: '100.0000 FO' },
  { symbol: 'FOUSDT', contract: 'eosio.token', balance: '50.0000 FOUSDT' },
]

// 辅助函数 - 来自老项目
function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return bytes + ' B'
}

function formatTime(us: number): string {
  if (us >= 3600000000) return (us / 3600000000).toFixed(2) + ' H'
  if (us >= 60000000) return (us / 60000000).toFixed(2) + ' M'
  if (us >= 1000000) return (us / 1000000).toFixed(2) + ' S'
  return (us / 1000).toFixed(2) + ' ms'
}

function getPercent(used: number, max: number): number {
  if (max === 0) return 0
  return Math.min((used / max) * 100, 100)
}

export default async function AccountPage({ params }: PageProps) {
  const { id } = await params
  const account = mockAccount

  // 计算资源使用率
  const ramPercent = getPercent(account.ram_usage, account.ram_quota)
  const cpuPercent = getPercent(account.cpu_limit.used, account.cpu_limit.max)
  const netPercent = getPercent(account.net_limit.used, account.net_limit.max)

  // 计算余额 - 来自老项目逻辑
  const staked = account.voter_info.staked / 10000
  const refundCpu = parseFloat(account.refund_request.cpu_amount.split(' ')[0] ?? '0')
  const refundNet = parseFloat(account.refund_request.net_amount.split(' ')[0] ?? '0')
  const refundTotal = refundCpu + refundNet
  const liquidBalance = parseFloat(account.core_liquid_balance.split(' ')[0] ?? '0')
  const totalBalance = staked + refundTotal + liquidBalance

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
          {id.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{id}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">FIBOS 账户</p>
        </div>
      </div>

      {/* Balance Cards - 数据来自 getAccount() 和 getTableRows() */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">总资产</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {totalBalance.toFixed(4)} FO
          </div>
        </div>

        {/* Available - core_liquid_balance 或 accounts 表 */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">可用余额</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {liquidBalance.toFixed(4)} FO
          </div>
        </div>

        {/* Staked - voter_info.staked / 10000 */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Vote className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">已抵押</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {staked.toFixed(4)} FO
          </div>
        </div>

        {/* Refund - refund_request */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">待赎回</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {refundTotal.toFixed(4)} FO
          </div>
        </div>
      </div>

      {/* Resources - 来自 getAccount() */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">资源使用</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* RAM - ram_usage / ram_quota */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">RAM</span>
              </div>
              <span className="text-sm text-slate-500">{ramPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${ramPercent}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {formatBytes(account.ram_usage)} / {formatBytes(account.ram_quota)}
            </div>
          </div>

          {/* CPU - cpu_limit.used / cpu_limit.max */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">CPU</span>
              </div>
              <span className="text-sm text-slate-500">{cpuPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${cpuPercent}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {formatTime(account.cpu_limit.used)} / {formatTime(account.cpu_limit.max)}
            </div>
          </div>

          {/* NET - net_limit.used / net_limit.max */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">NET</span>
              </div>
              <span className="text-sm text-slate-500">{netPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${netPercent}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {formatBytes(account.net_limit.used)} / {formatBytes(account.net_limit.max)}
            </div>
          </div>
        </div>
      </div>

      {/* Tokens - 来自 getCurrencyBalance() 和 getTableRows("accounts") */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">代币资产</h2>
        </div>
        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {mockTokens.map((token) => (
            <div key={`${token.contract}-${token.symbol}`} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {token.symbol.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{token.symbol}</div>
                  <div className="text-xs text-slate-400">{token.contract}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-slate-900 dark:text-white">{token.balance}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voting Info - 来自 getAccount().voter_info */}
      {account.voter_info.producers.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">投票信息</h2>
          </div>
          <div className="p-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              已投票给 {account.voter_info.producers.length} 个节点
            </div>
            <div className="flex flex-wrap gap-2">
              {account.voter_info.producers.map((producer) => (
                <Link
                  key={producer}
                  href={`/explorer/accounts/${producer}`}
                  className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-cyan-400 rounded-lg text-sm font-mono hover:bg-purple-500/20 transition-colors"
                >
                  {producer}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Actions - 来自 getActions() */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">最近操作</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            来自 getActions()
          </span>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="col-span-3">Action</div>
          <div className="col-span-3">交易 ID</div>
          <div className="col-span-3">区块</div>
          <div className="col-span-3">时间</div>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {mockActions.map((action, index) => (
            <Link
              key={index}
              href={`/explorer/transactions/${action.transaction_id}`}
              className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors items-center"
            >
              {/* Action */}
              <div className="sm:col-span-3 flex items-center gap-1.5">
                <span className="font-medium text-sm text-slate-900 dark:text-white">{action.name}</span>
                <span className="text-xs text-slate-400">@{action.contract}</span>
              </div>
              {/* TX ID */}
              <div className="sm:col-span-3 font-mono text-xs text-purple-600 dark:text-cyan-400 truncate">
                {action.transaction_id}
              </div>
              {/* Block */}
              <div className="sm:col-span-3 text-xs text-slate-600 dark:text-slate-300">
                #{action.block_num.toLocaleString()}
              </div>
              {/* Time */}
              <div className="sm:col-span-3 text-xs text-slate-400">
                {action.block_time.split('T')[1]?.split('.')[0] || action.block_time}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
