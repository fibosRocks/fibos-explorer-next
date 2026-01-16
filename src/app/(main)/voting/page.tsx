'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Vote, Users, TrendingUp, Search, CheckSquare, Square, AlertCircle, UserCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 投票页面
 *
 * 数据来源 (参考老项目 voting/voting.component.ts):
 * - eosService.eos.getTableRows("eosio", "eosio", "global") -> total_producer_vote_weight
 * - eosService.eos.getTableRows("eosio", "eosio", "producers") -> 节点列表
 * - eosService.eos.getAccount(account_name) -> voter_info.producers (已投票节点), voter_info.staked
 *
 * 节点字段: owner, total_votes, producer_key, url, unpaid_blocks, last_claim_time, is_active
 *
 * 投票操作:
 * - 合约: eosio
 * - Action: voteproducer
 * - 数据: { voter, proxy: "", producers: [...] } 或 { voter, proxy: "代理账户", producers: [] }
 * - 最多可投 30 个节点
 */

// 配置: 推荐的投票代理人账户
const RECOMMENDED_PROXY = 'rockrockrock'

// 模拟全局数据 (来自 global 表)
const globalData = {
  total_producer_vote_weight: '1456789012345678901234',
}

// 模拟节点列表 (来自 producers 表)
const mockProducers = [
  { owner: 'fibosgenesis', total_votes: '123456789012345678', is_active: true, url: '' },
  { owner: 'fibosbpnode1', total_votes: '112345678901234567', is_active: true, url: '' },
  { owner: 'fibosoffical', total_votes: '109876543210987654', is_active: true, url: '' },
  { owner: 'fibosnode888', total_votes: '98765432109876543', is_active: true, url: '' },
  { owner: 'fibosisgreat', total_votes: '87654321098765432', is_active: true, url: '' },
  { owner: 'fibosmainnet', total_votes: '76543210987654321', is_active: true, url: '' },
  { owner: 'fibosworld11', total_votes: '65432109876543210', is_active: true, url: '' },
  { owner: 'fiboschain11', total_votes: '54321098765432109', is_active: true, url: '' },
  { owner: 'fibosbp11111', total_votes: '43210987654321098', is_active: true, url: '' },
  { owner: 'fibosteam111', total_votes: '32109876543210987', is_active: true, url: '' },
]

// 模拟已投票记录 (来自 getAccount().voter_info.producers)
const mockVotedProducers = ['fibosgenesis', 'fibosbpnode1', 'fibosoffical']

// 模拟抵押量 (来自 voter_info.staked / 10000)
const mockStaked = 500.0

// 计算得票率
function getVotePercent(total_votes: string, total_weight: string): string {
  const votes = parseFloat(total_votes)
  const weight = parseFloat(total_weight)
  if (weight === 0) return '0.00'
  return ((votes / weight) * 100).toFixed(2)
}

export default function VotingPage() {
  // 搜索关键词
  const [keywords, setKeywords] = useState('')

  // 已选节点 - 初始化时读取已投票记录
  const [selectedProducers, setSelectedProducers] = useState<Set<string>>(
    new Set(mockVotedProducers)
  )

  // 模拟钱包连接状态
  const [isConnected] = useState(false)
  const accountName = isConnected ? 'myaccount123' : ''

  // 过滤节点列表
  const filteredProducers = mockProducers.filter((producer) =>
    producer.owner.toLowerCase().includes(keywords.toLowerCase())
  )

  // 切换节点选中状态
  const toggleProducer = (owner: string, isActive: boolean) => {
    if (!isActive) {
      // 已注销节点不能选择
      return
    }

    const newSelected = new Set(selectedProducers)
    if (newSelected.has(owner)) {
      newSelected.delete(owner)
    } else {
      // 最多选择 30 个
      if (newSelected.size >= 30) {
        return
      }
      newSelected.add(owner)
    }
    setSelectedProducers(newSelected)
  }

  // 全选前 21 个
  const selectTop21 = () => {
    const top21 = mockProducers
      .filter((p) => p.is_active)
      .slice(0, 21)
      .map((p) => p.owner)
    setSelectedProducers(new Set(top21))
  }

  // 清空选择
  const clearSelection = () => {
    setSelectedProducers(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">节点投票</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">为 FIBOS 超级节点投票，参与社区治理</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Producers */}
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
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {isConnected ? `${mockStaked.toFixed(4)} FO` : '0 FO'}
          </div>
          <div className="text-sm text-slate-400 mt-1">用于投票的抵押量</div>
        </div>

        {/* My Voted Producers */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Vote className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">已选节点</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {selectedProducers.size} 个
          </div>
          <div className="text-sm text-slate-400 mt-1">最多可投 30 个</div>
        </div>
      </div>

      {/* Proxy Voting Recommendation */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                使用投票代理
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                不确定投给谁？将投票权委托给专业代理人，由其代为选择优质节点
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">推荐代理人</div>
              <Link
                href={`/explorer/accounts/${RECOMMENDED_PROXY}`}
                className="font-mono text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                {RECOMMENDED_PROXY}
              </Link>
            </div>
            <button
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              设为代理
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            投票代理机制允许您将投票权委托给信任的代理人。代理人会根据其专业判断为您投票，您的票权会自动跟随代理人的投票选择。您可以随时取消代理或更换代理人。
          </p>
        </div>
      </div>

      {/* Selected Producers Summary */}
      {selectedProducers.size > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                已选择 {selectedProducers.size} 个节点
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              清空选择
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedProducers).map((owner) => (
              <span
                key={owner}
                className="px-2 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded text-xs font-mono"
              >
                {owner}
              </span>
            ))}
          </div>
          {/* Vote Button - Inside Selected Producers */}
          <div className="mt-4 pt-4 border-t border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <AlertCircle className="w-4 h-4" />
              <span>投票需要连接钱包并有抵押的 FO</span>
            </div>
            <button
              disabled={selectedProducers.size === 0}
              className={cn(
                'px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all',
                selectedProducers.size > 0
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
            >
              <Vote className="w-4 h-4" />
              确认投票 ({selectedProducers.size})
            </button>
          </div>
        </div>
      )}

      {/* Producers List */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        {/* Header with Search */}
        <div className="p-4 border-b border-slate-200/50 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">超级节点列表</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={selectTop21}
                className="px-3 py-1.5 text-xs font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors"
              >
                选择前21
              </button>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="搜索节点..."
                  className="h-8 pl-9 pr-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="col-span-1"></div>
          <div className="col-span-1">排名</div>
          <div className="col-span-4">节点名称</div>
          <div className="col-span-3">得票权重</div>
          <div className="col-span-2">得票率</div>
          <div className="col-span-1">状态</div>
        </div>

        {/* Producers */}
        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {filteredProducers.map((producer, index) => {
            const rank = index + 1
            const isChecked = selectedProducers.has(producer.owner)
            const votePercent = getVotePercent(producer.total_votes, globalData.total_producer_vote_weight)

            return (
              <div
                key={producer.owner}
                onClick={() => toggleProducer(producer.owner, producer.is_active)}
                className={cn(
                  'grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 cursor-pointer transition-colors items-center',
                  isChecked
                    ? 'bg-purple-500/5 hover:bg-purple-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5',
                  !producer.is_active && 'opacity-50 cursor-not-allowed'
                )}
              >
                {/* Checkbox */}
                <div className="sm:col-span-1 flex items-center">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-purple-500" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                {/* Rank */}
                <div className="sm:col-span-1">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs',
                      rank <= 3
                        ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white'
                        : rank <= 21
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {rank}
                  </div>
                </div>

                {/* Owner */}
                <div className="sm:col-span-4">
                  <Link
                    href={`/explorer/accounts/${producer.owner}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-sm text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-cyan-400"
                  >
                    {producer.owner}
                  </Link>
                </div>

                {/* Votes */}
                <div className="sm:col-span-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                  {parseFloat(producer.total_votes).toExponential(4)}
                </div>

                {/* Vote Percent */}
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(parseFloat(votePercent) * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">
                      {votePercent}%
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="sm:col-span-1">
                  {rank <= 21 ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      出块
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400">
                      候选
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Connect Wallet Prompt */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20 p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">连接钱包参与投票</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">连接您的 FIBOS 钱包以进行节点投票</p>
          <button className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            连接钱包
          </button>
        </div>
      )}
    </div>
  )
}
