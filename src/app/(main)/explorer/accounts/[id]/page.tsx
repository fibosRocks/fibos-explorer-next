import Link from 'next/link'
import { User, Wallet, Cpu, HardDrive, Wifi, Clock, Vote, Coins, Key } from 'lucide-react'
import * as eos from '@/lib/services/eos'
import type { Account } from '@/lib/services/types'
import { Collapsible } from '@/components/ui/collapsible'
import { AccountTraces } from '@/components/features/account-traces'
import { ProducerVoters } from '@/components/features/producer-voters'
import { ProxiedAccounts } from '@/components/features/proxied-accounts'

import { formatBytes, formatTime, formatPercent, formatBalance, formatPublicKey } from '@/lib/utils/format'

interface PageProps {
  params: Promise<{ id: string }>
}

// 辅助函数
function getPercent(used: number, max: number): number {
  if (max === 0) return 0
  return (used / max) * 100
}

function parseBalance(balance?: string): number {
  if (!balance) return 0
  return parseFloat(balance.split(' ')[0]) || 0
}

export default async function AccountPage({ params }: PageProps) {
  const { id } = await params

  let account: Account | null = null
  let balances: { quantity: string; contract: string }[] = []
  let error: string | null = null

  try {
    // 并行获取账户信息和代币余额
    const [accountData, balanceRows] = await Promise.all([
      eos.getAccount(id),
      eos.getAccountBalances(id),
    ])
    account = accountData
    balances = balanceRows.map((row) => ({
      quantity: row.balance.quantity,
      contract: row.balance.contract,
    }))
  } catch (err) {
    console.error('获取账户数据失败:', err)
    error = '账户不存在或获取数据失败'
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <User className="w-12 h-12 mb-4 text-slate-300" />
        <p>{error || '账户不存在'}</p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          返回首页
        </Link>
      </div>
    )
  }

  // 计算资源使用率
  const ramPercent = getPercent(account.ram_usage, account.ram_quota)
  const cpuPercent = getPercent(account.cpu_limit.used, account.cpu_limit.max)
  const netPercent = getPercent(account.net_limit.used, account.net_limit.max)

  // 计算余额
  const staked = (account.voter_info?.staked || 0) / 10000
  const refundCpu = parseBalance(account.refund_request?.cpu_amount)
  const refundNet = parseBalance(account.refund_request?.net_amount)
  const refundTotal = refundCpu + refundNet

  // FIBOS 特殊处理：从 balances 中获取 FO 余额
  const foBalance = balances.find((b) => b.quantity.endsWith('FO'))
  const liquidBalance = foBalance ? parseBalance(foBalance.quantity) : parseBalance(account.core_liquid_balance)
  const totalBalance = staked + refundTotal + liquidBalance

  // 投票信息
  const votedProducers = account.voter_info?.producers || []
  const proxy = account.voter_info?.proxy || ''

  // 代理信息
  const isProxy = account.voter_info?.is_proxy === 1

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

      {/* Balance Cards */}
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

        {/* Available */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">可用余额</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {liquidBalance.toFixed(4)} FO
          </div>
        </div>

        {/* Staked */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Vote className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-slate-500 dark:text-slate-400">已抵押</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {staked.toFixed(4)} FO
          </div>
        </div>

        {/* Refund */}
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

      {/* Resources */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">资源使用</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* RAM */}
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

          {/* CPU */}
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

          {/* NET */}
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

      {/* Voting Info */}
      {(votedProducers.length > 0 || proxy) && (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">投票信息</h2>
          </div>
          <div className="p-4">
            {proxy ? (
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  已设置代理
                </div>
                <Link
                  href={`/explorer/accounts/${proxy}`}
                  className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-mono hover:bg-amber-500/20 transition-colors"
                >
                  {proxy}
                </Link>
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  已投票给 {votedProducers.length} 个节点
                </div>
                <div className="flex flex-wrap gap-2">
                  {votedProducers.map((producer) => (
                    <Link
                      key={producer}
                      href={`/explorer/accounts/${producer}`}
                      className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-cyan-400 rounded-lg text-sm font-mono hover:bg-purple-500/20 transition-colors"
                    >
                      {producer}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Producer Voters Info (If account is a producer) */}
      <ProducerVoters accountName={id} />

      {/* Proxied Accounts (If account is a proxy) */}
      <ProxiedAccounts accountName={id} isProxy={isProxy} />

      {/* Tokens - Collapsible with Card Grid */}
      {balances.length > 0 && (
        <Collapsible title="代币资产" badge={balances.length}>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {balances.map((token, index) => {
              const parts = token.quantity.split(' ')
              const amount = parts[0] || '0'
              const symbol = parts[1] || 'UNKNOWN'

              return (
                <div
                  key={index}
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white text-sm">{symbol}</span>
                  </div>
                  <div className="font-mono text-sm text-slate-700 dark:text-slate-200 truncate">
                    {amount}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {token.contract}
                  </div>
                </div>
              )
            })}
          </div>
        </Collapsible>
      )}

      {/* Permissions - Collapsible */}
      {account.permissions && account.permissions.length > 0 && (
        <Collapsible title="权限" badge={account.permissions.length}>
          <div className="divide-y divide-slate-200/50 dark:divide-white/10">
            {account.permissions.map((perm) => (
              <div key={perm.perm_name} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-slate-900 dark:text-white">{perm.perm_name}</span>
                  {perm.parent && (
                    <span className="text-xs text-slate-400">← {perm.parent}</span>
                  )}
                </div>
                <div className="space-y-1 ml-6">
                  {perm.required_auth.keys.map((key, index) => (
                    <Link
                      key={index}
                      href={`/explorer/publickey/${key.key}`}
                      className="block font-mono text-xs text-purple-600 dark:text-cyan-400 hover:underline break-all"
                    >
                      {formatPublicKey(key.key)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Transaction History */}
      <AccountTraces accountName={id} />
    </div>
  )
}
