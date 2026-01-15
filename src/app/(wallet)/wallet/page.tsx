import { PieChart, ArrowUpRight, ArrowDownRight, Cpu, HardDrive, Wifi, Clock } from 'lucide-react'

/**
 * 钱包资产概览页面
 *
 * 数据来源 (参考老项目 ironman.service.ts - getStatus()):
 * - eosService.eos.getAccount(name) 返回:
 *   - ram_usage, ram_quota - RAM 使用情况
 *   - cpu_limit.used, cpu_limit.max - CPU 使用情况
 *   - net_limit.used, net_limit.max - NET 使用情况
 *   - voter_info.staked - 已抵押数量
 *   - refund_request - 待赎回 (cpu_amount, net_amount)
 *   - core_liquid_balance - 可用余额 (非FIBOS链)
 *
 * - FIBOS 链特殊处理:
 *   - eosService.eos.getTableRows("eosio.token", account, "accounts") -> 获取 FO 余额
 *   - eosService.eos.getTableRows("eosio.token", account, "lockaccounts") -> 锁仓金额
 */

export default function WalletOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">资产概览</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">管理您的 FIBOS 资产</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance - 来自 balance 或 core_liquid_balance */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">可用余额</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0.0000 FO</div>
          <div className="text-sm text-slate-400 mt-1">可自由转账</div>
        </div>

        {/* Staked - 来自 voter_info.staked / 10000 */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">已抵押</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0.0000 FO</div>
          <div className="text-sm text-slate-400 mt-1">CPU + NET 资源</div>
        </div>

        {/* Refund - 来自 refund_request (cpu_amount + net_amount) */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">待赎回</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">0.0000 FO</div>
          <div className="text-sm text-slate-400 mt-1">3天后可取回</div>
        </div>
      </div>

      {/* Resources - 数据来自 getAccount() 返回的 ram_quota, cpu_limit, net_limit */}
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
              <span className="text-sm text-slate-500">0%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '0%' }} />
            </div>
            <div className="text-xs text-slate-400 mt-1">0 B / 0 B</div>
          </div>

          {/* CPU - cpu_limit.used / cpu_limit.max */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">CPU</span>
              </div>
              <span className="text-sm text-slate-500">0%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '0%' }} />
            </div>
            <div className="text-xs text-slate-400 mt-1">0 ms / 0 ms</div>
          </div>

          {/* NET - net_limit.used / net_limit.max */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-slate-600 dark:text-slate-300">NET</span>
              </div>
              <span className="text-sm text-slate-500">0%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
            </div>
            <div className="text-xs text-slate-400 mt-1">0 B / 0 B</div>
          </div>
        </div>
      </div>

      {/* Connect Wallet Prompt */}
      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20 p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">连接钱包开始使用</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">连接您的 FIBOS 钱包以查看资产和进行操作</p>
        <button className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
          连接钱包
        </button>
      </div>
    </div>
  )
}
