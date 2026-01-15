import { Vote, Users, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

/**
 * 投票页面
 *
 * 数据来源 (参考老项目 voting.component.ts):
 * - eosService.eos.getTableRows("eosio", "eosio", "global") -> total_producer_vote_weight, pervote_bucket, perblock_bucket
 * - eosService.eos.getTableRows("eosio", "eosio", "producers") -> 节点列表
 * - eosService.eos.getAccount(account_name) -> voter_info.staked, voter_info.producers
 *
 * 节点字段: owner, total_votes, producer_key, url, unpaid_blocks, last_claim_time, is_active
 */

// 模拟数据 - 顶级节点 (实际字段来自 producers 表)
const topProducers = [
  { rank: 1, owner: 'fibosgenesis', total_votes: '123456789012345678', is_active: true, url: '' },
  { rank: 2, owner: 'fibosbpnode1', total_votes: '112345678901234567', is_active: true, url: '' },
  { rank: 3, owner: 'fibosoffical', total_votes: '109876543210987654', is_active: true, url: '' },
  { rank: 4, owner: 'fibosnode888', total_votes: '98765432109876543', is_active: true, url: '' },
  { rank: 5, owner: 'fibosisgreat', total_votes: '87654321098765432', is_active: true, url: '' },
]

// 模拟全局数据 (来自 global 表)
const globalData = {
  total_producer_vote_weight: '1456789012345678901234',
}

// 计算得票率
function getVotePercent(total_votes: string, total_weight: string): string {
  const votes = parseFloat(total_votes)
  const weight = parseFloat(total_weight)
  if (weight === 0) return '0.00'
  return ((votes / weight) * 100).toFixed(2)
}

export default function VotingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">节点投票</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">为 FIBOS 超级节点投票，参与社区治理</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Producers - 来自 producers 表过滤 is_active */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">出块节点</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">21</div>
          <div className="text-sm text-slate-400 mt-1">活跃生产者</div>
        </div>

        {/* My Staked - 来自 getAccount().voter_info.staked */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">我的抵押</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">0 FO</div>
          <div className="text-sm text-slate-400 mt-1">用于投票的抵押量</div>
        </div>

        {/* My Voted Producers - 来自 getAccount().voter_info.producers.length */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Vote className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">已投节点</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">0 个</div>
          <div className="text-sm text-slate-400 mt-1">最多可投 30 个</div>
        </div>
      </div>

      {/* Top Producers - 数据来自 producers 表 */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">超级节点排名</h2>
          <Link
            href="/voting/producers"
            className="text-sm text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {topProducers.map((producer) => (
            <div
              key={producer.owner}
              className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                producer.rank <= 3
                  ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {producer.rank}
              </div>

              {/* Logo placeholder */}
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                <Users className="w-5 h-5" />
              </div>

              {/* Info - owner 字段 */}
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white">{producer.owner}</div>
                <div className="text-xs text-slate-400">
                  {producer.is_active ? '活跃' : '未激活'}
                </div>
              </div>

              {/* Vote Percent - 计算: total_votes / total_producer_vote_weight * 100 */}
              <div className="text-right">
                <div className="font-medium text-slate-900 dark:text-white">
                  {getVotePercent(producer.total_votes, globalData.total_producer_vote_weight)}%
                </div>
                <div className="text-xs text-slate-400">得票率</div>
              </div>

              {/* Vote Button */}
              <button className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 text-sm font-medium hover:bg-purple-500/20 transition-colors">
                投票
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Votes Card */}
        <Link
          href="/voting/my"
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6 hover:border-purple-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">我的投票</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">查看和管理已投票的节点</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
          </div>
        </Link>

        {/* Proxy Voting */}
        <Link
          href="/voting/proxy"
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6 hover:border-purple-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">代理投票</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">设置或取消投票代理</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Connect Wallet Prompt */}
      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20 p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">连接钱包参与投票</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">连接您的 FIBOS 钱包以进行节点投票</p>
        <button className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
          连接钱包
        </button>
      </div>
    </div>
  )
}
