import { Monitor, Users, HardDrive, Activity, CheckCircle, Clock, XCircle } from 'lucide-react'

/**
 * 节点监控页面
 *
 * 数据来源 (参考老项目 monitor.component.ts):
 * - environment.apiUrl + '/producers' -> 节点列表
 * - eosService.eos.getProducers(true, "", 200) -> 节点排名
 * - environment.monitorUrl + '/v1/chain/get_info' -> head_block_num, last_irreversible_block_num, head_block_producer, server_version_string
 * - https://api.fibos123.com/bp_status -> 节点在线状态 (外部API)
 *
 * 节点字段: owner, total_votes, is_active, rank (计算得出)
 * 状态判断: 通过 bp_status API 的 number 与 last_irreversible_block_num 对比
 */

// 模拟数据 - 节点列表 (实际字段来自 producers 表 + API)
const nodes = [
  { rank: 1, owner: 'fibosgenesis', total_votes: '123456789012345678', is_active: true, isBad: false },
  { rank: 2, owner: 'fibosbpnode1', total_votes: '112345678901234567', is_active: true, isBad: false },
  { rank: 3, owner: 'fibosoffical', total_votes: '109876543210987654', is_active: true, isBad: false },
  { rank: 4, owner: 'fibosnode888', total_votes: '98765432109876543', is_active: true, isBad: false },
  { rank: 5, owner: 'fibosisgreat', total_votes: '87654321098765432', is_active: true, isBad: true },
]

// 模拟链信息 (来自 get_info)
const chainInfo = {
  server_version_string: 'v3.2.1',
  head_block_num: 123456789,
  last_irreversible_block_num: 123456750,
  head_block_producer: 'fibosgenesis',
}

function StatusBadge({ isBad, rank }: { isBad: boolean; rank: number }) {
  // rank <= 21 是出块节点，> 21 是候选节点
  if (rank > 21) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400">
        候选
      </span>
    )
  }

  if (isBad) {
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
        异常
      </span>
    )
  }

  return (
    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      出块中
    </span>
  )
}

export default function NodesPage() {
  // 统计健康节点数 (老项目逻辑)
  const healthyProducers = nodes.filter(n => n.rank <= 21 && !n.isBad).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">节点监控</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">实时监控 FIBOS 网络节点状态</p>
      </div>

      {/* Network Stats - 数据来自 get_info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Healthy Producers */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">健康节点</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{healthyProducers} / 21</div>
        </div>

        {/* Head Block - 来自 get_info.head_block_num */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">最新区块</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {chainInfo.head_block_num.toLocaleString()}
          </div>
        </div>

        {/* LIB - 来自 get_info.last_irreversible_block_num */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">不可逆区块</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {chainInfo.last_irreversible_block_num.toLocaleString()}
          </div>
        </div>

        {/* Current Producer - 来自 get_info.head_block_producer */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">当前出块</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {chainInfo.head_block_producer}
          </div>
        </div>
      </div>

      {/* Nodes Table */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">出块节点 (Top 21)</h2>
          <div className="text-sm text-slate-400">
            版本: {chainInfo.server_version_string}
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">排名</div>
          <div className="col-span-4">节点名称</div>
          <div className="col-span-3">状态</div>
          <div className="col-span-4">得票权重</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-200/50 dark:divide-white/10">
          {nodes.map((node) => (
            <div
              key={node.owner}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              {/* Rank */}
              <div className="md:col-span-1 flex items-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  node.rank <= 3
                    ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {node.rank}
                </div>
              </div>

              {/* Node Name - owner 字段 */}
              <div className="md:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{node.owner}</div>
                  <div className="text-xs text-slate-400">
                    {node.owner === chainInfo.head_block_producer && (
                      <span className="text-emerald-500">正在出块</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status - 通过 bp_status API 判断 */}
              <div className="md:col-span-3 flex items-center">
                <StatusBadge isBad={node.isBad} rank={node.rank} />
              </div>

              {/* Vote Weight - total_votes 字段 */}
              <div className="md:col-span-4 flex items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                  {parseFloat(node.total_votes).toExponential(4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>出块中 - 节点正常出块</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>异常 - 节点可能离线或落后</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500" />
          <span>候选 - 排名 21 以后的备选节点</span>
        </div>
      </div>
    </div>
  )
}
