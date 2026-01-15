'use client'

import { useState } from 'react'
import { Cpu, HardDrive, Wifi, ArrowUp, ArrowDown, Info, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'cpu' | 'net' | 'ram'
type Action = 'stake' | 'unstake'

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('cpu')
  const [action, setAction] = useState<Action>('stake')

  const tabs = [
    { id: 'cpu' as Tab, label: 'CPU', icon: Cpu, color: 'cyan' },
    { id: 'net' as Tab, label: 'NET', icon: Wifi, color: 'blue' },
    { id: 'ram' as Tab, label: 'RAM', icon: HardDrive, color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">资源管理</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">管理您的 CPU、NET 和 RAM 资源</p>
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500 dark:text-slate-400">CPU</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">0.0000 FO</div>
            </div>
            <span className="text-sm text-slate-500">0%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: '0%' }} />
          </div>
          <div className="text-xs text-slate-400 mt-2">0 ms / 0 ms</div>
        </div>

        {/* NET */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500 dark:text-slate-400">NET</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">0.0000 FO</div>
            </div>
            <span className="text-sm text-slate-500">0%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
          </div>
          <div className="text-xs text-slate-400 mt-2">0 B / 0 B</div>
        </div>

        {/* RAM */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500 dark:text-slate-400">RAM</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">0 B</div>
            </div>
            <span className="text-sm text-slate-500">0%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '0%' }} />
          </div>
          <div className="text-xs text-slate-400 mt-2">0 B / 0 B</div>
        </div>
      </div>

      {/* Management Panel */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200/50 dark:border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-cyan-400 border-b-2 border-purple-600 dark:border-cyan-400 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Action Toggle */}
          {activeTab !== 'ram' && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAction('stake')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors',
                  action === 'stake'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <ArrowUp className="w-4 h-4" />
                抵押
              </button>
              <button
                onClick={() => setAction('unstake')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors',
                  action === 'unstake'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <ArrowDown className="w-4 h-4" />
                赎回
              </button>
            </div>
          )}

          {/* RAM Buy/Sell Toggle */}
          {activeTab === 'ram' && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAction('stake')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors',
                  action === 'stake'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <ArrowUp className="w-4 h-4" />
                购买
              </button>
              <button
                onClick={() => setAction('unstake')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors',
                  action === 'unstake'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <ArrowDown className="w-4 h-4" />
                出售
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {activeTab === 'ram' ? (action === 'stake' ? '购买数量 (Bytes)' : '出售数量 (Bytes)') : (action === 'stake' ? '抵押金额 (FO)' : '赎回金额 (FO)')}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={activeTab === 'ram' ? '0' : '0.0000'}
                className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-600 dark:text-cyan-400 font-medium hover:underline">
                最大值
              </button>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>{action === 'stake' ? '可用余额' : (activeTab === 'ram' ? '已有RAM' : `已抵押${activeTab.toUpperCase()}`)}</span>
              <span>{activeTab === 'ram' ? '0 B' : '0.0000 FO'}</span>
            </div>
          </div>

          {/* Receiver (for staking to others) */}
          {activeTab !== 'ram' && action === 'stake' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                接收账户 <span className="text-slate-400 font-normal">(可选，默认为自己)</span>
              </label>
              <input
                type="text"
                placeholder="输入 FIBOS 账户名"
                className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {activeTab === 'cpu' && action === 'stake' && '抵押 FO 可获得 CPU 资源，用于执行智能合约操作。CPU 资源每24小时自动恢复。'}
                {activeTab === 'cpu' && action === 'unstake' && '赎回 CPU 需要 3 天等待期，期间资源仍可使用。到期后可以取回 FO。'}
                {activeTab === 'net' && action === 'stake' && '抵押 FO 可获得 NET 资源，用于网络带宽。NET 资源每24小时自动恢复。'}
                {activeTab === 'net' && action === 'unstake' && '赎回 NET 需要 3 天等待期，期间资源仍可使用。到期后可以取回 FO。'}
                {activeTab === 'ram' && action === 'stake' && 'RAM 用于存储账户数据。购买 RAM 是立即生效的市场交易，价格随供需波动。'}
                {activeTab === 'ram' && action === 'unstake' && '出售 RAM 可立即获得 FO，但会失去对应的存储空间。请确保账户数据已迁移。'}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button className="w-full h-12 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            {activeTab === 'ram' ? (action === 'stake' ? '购买 RAM' : '出售 RAM') : (action === 'stake' ? `抵押 ${activeTab.toUpperCase()}` : `赎回 ${activeTab.toUpperCase()}`)}
          </button>
        </div>
      </div>

      {/* Pending Refunds */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">待赎回</h2>
          <button className="text-sm text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          暂无待赎回的资源
        </div>
      </div>
    </div>
  )
}
