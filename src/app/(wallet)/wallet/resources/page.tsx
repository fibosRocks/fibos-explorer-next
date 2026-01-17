'use client'

import { useState, useEffect } from 'react'
import { Cpu, HardDrive, Wifi, ArrowUp, ArrowDown, Info, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWalletStore } from '@/stores/walletStore'
import { TransactionSuccess } from '@/components/features/TransactionSuccess'
import { useTranslation } from '@/lib/i18n'

type Tab = 'cpu' | 'net' | 'ram'
type Action = 'stake' | 'unstake'

export default function ResourcesPage() {
  const { t } = useTranslation()
  const { connected, account, accountStatus, balances, connect, connecting, transact, getPermission, refreshAccountInfo } = useWalletStore()

  const [activeTab, setActiveTab] = useState<Tab>('cpu')
  const [action, setAction] = useState<Action>('stake')
  const [amount, setAmount] = useState('')
  const [receiver, setReceiver] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; txId?: string } | null>(null)

  // 当 Tab 切换时重置状态
  useEffect(() => {
    setAmount('')
    setError(null)
    setSuccess(null)
    // 默认接收者为自己
    if (account) {
      setReceiver(account.name)
    }
  }, [activeTab, action, account])

  const tabs = [
    { id: 'cpu' as Tab, label: 'CPU', icon: Cpu, color: 'cyan' },
    { id: 'net' as Tab, label: 'NET', icon: Wifi, color: 'blue' },
    { id: 'ram' as Tab, label: 'RAM', icon: HardDrive, color: 'purple' },
  ]

  // 计算进度条百分比
  const getPercent = (used: number, max: number) => {
    if (max === 0) return 0
    return Math.min((used / max) * 100, 100)
  }

  // 格式化大小
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化时间
  const formatTime = (microSeconds: number) => {
    if (microSeconds < 1000) return `${microSeconds} μs`
    return `${(microSeconds / 1000).toFixed(2)} ms`
  }

  // 获取可用余额或资源
  const getAvailable = () => {
    if (!accountStatus) return '0'

    if (activeTab === 'ram') {
        if (action === 'stake') {
             // 购买 RAM，显示 FO 余额
             return accountStatus.balance
        } else {
             // 出售 RAM，显示可用 RAM 字节数（未使用部分? 或者总 RAM? 通常卖未使用的）
             // 出售的是 bytes
             return `${accountStatus.ram.available} Bytes` // 或者 formatBytes
        }
    }

    // CPU/NET
    if (action === 'stake') {
        // 抵押，显示 FO 余额
        return accountStatus.balance
    } else {
        // 赎回，显示已抵押量
        // 这里需要获取 `self_delegated_bandwidth`，store 里似乎没直接暴露详细的 delegated 信息
        // accountStatus.staked 是总抵押。我们可能需要从 accountInfo 里读。
        // 暂时显示 accountStatus.staked (这是总抵押)，或者我们可以改进 store
        return `${accountStatus.staked} FO` // 这是一个简化的显示
    }
  }

  // 设置最大值
  const setMax = () => {
      // 简单实现，实际可能需要预留手续费
      const avail = getAvailable()
      const parts = avail.split(' ')
      const val = parseFloat(parts[0] ?? '0')
      if (activeTab === 'ram' && action === 'unstake') {
          // 如果是 bytes
          setAmount(accountStatus?.ram.available.toString() || '0')
      } else {
          setAmount(val.toString())
      }
  }

  // 处理交易
  const handleTransaction = async () => {
    if (!connected || !account) {
        connect()
        return
    }

    if (!amount || parseFloat(amount) <= 0) {
        setError(t('resources.invalidAmount'))
        return
    }

    const permission = getPermission()
    if (!permission) {
        setError(t('resources.noPermission'))
        return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
        let actions = []
        const target = receiver || account.name

        if (activeTab === 'ram') {
            if (action === 'stake') {
                // 买 RAM (Buy RAM Bytes)
                actions.push({
                    account: 'eosio',
                    name: 'buyrambytes',
                    authorization: [permission],
                    data: {
                        payer: account.name,
                        receiver: target,
                        bytes: parseInt(amount)
                    }
                })
            } else {
                // 卖 RAM
                actions.push({
                    account: 'eosio',
                    name: 'sellram',
                    authorization: [permission],
                    data: {
                        account: account.name,
                        bytes: parseInt(amount)
                    }
                })
            }
        } else {
            // CPU / NET
            const quant = `${parseFloat(amount).toFixed(4)} FO`
            if (action === 'stake') {
                actions.push({
                    account: 'eosio',
                    name: 'delegatebw',
                    authorization: [permission],
                    data: {
                        from: account.name,
                        receiver: target,
                        stake_net_quantity: activeTab === 'net' ? quant : '0.0000 FO',
                        stake_cpu_quantity: activeTab === 'cpu' ? quant : '0.0000 FO',
                        transfer: 0
                    }
                })
            } else {
                 actions.push({
                    account: 'eosio',
                    name: 'undelegatebw',
                    authorization: [permission],
                    data: {
                        from: account.name,
                        receiver: target,
                        unstake_net_quantity: activeTab === 'net' ? quant : '0.0000 FO',
                        unstake_cpu_quantity: activeTab === 'cpu' ? quant : '0.0000 FO',
                    }
                })
            }
        }

        const result = await transact(actions)
        setSuccess({
            message: t('resources.operationSuccess'),
            txId: result.transaction_id
        })
        setAmount('')

    } catch (err) {
        setError(err instanceof Error ? err.message : t('resources.operationFailed'))
    } finally {
        setLoading(false)
    }
  }

  // 获取按钮文本
  const getButtonText = () => {
    if (!connected) return t('resources.pleaseConnectWallet')
    if (activeTab === 'ram') {
      return action === 'stake' ? t('resources.buyRam') : t('resources.sellRam')
    }
    if (activeTab === 'cpu') {
      return action === 'stake' ? t('resources.stakeCpu') : t('resources.unstakeCpu')
    }
    return action === 'stake' ? t('resources.stakeNet') : t('resources.unstakeNet')
  }

  // 获取可用标签
  const getAvailableLabel = () => {
    if (action === 'stake') return t('resources.availableBalance')
    if (activeTab === 'ram') return t('resources.sellableRam')
    return activeTab === 'cpu' ? t('resources.stakedCpu') : t('resources.stakedNet')
  }

  // 获取输入标签
  const getInputLabel = () => {
    if (activeTab === 'ram') {
      return action === 'stake' ? t('resources.buyRamBytes') : t('resources.sellRamBytes')
    }
    return action === 'stake' ? t('resources.stakeAmount') : t('resources.unstakeAmount')
  }

  // 获取信息文本
  const getInfoText = () => {
    if (activeTab === 'cpu' && action === 'stake') return t('resources.cpuStakeInfo')
    if (activeTab === 'cpu' && action === 'unstake') return t('resources.cpuUnstakeInfo')
    if (activeTab === 'net' && action === 'stake') return t('resources.netStakeInfo')
    if (activeTab === 'net' && action === 'unstake') return t('resources.netUnstakeInfo')
    if (activeTab === 'ram' && action === 'stake') return t('resources.ramBuyInfo')
    return t('resources.ramSellInfo')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('resources.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('resources.subtitle')}</p>
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
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatTime(accountStatus?.cpu.used || 0)} / {formatTime(accountStatus?.cpu.max || 0)}
              </div>
            </div>
            <span className="text-sm text-slate-500">{getPercent(accountStatus?.cpu.used || 0, accountStatus?.cpu.max || 0).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${getPercent(accountStatus?.cpu.used || 0, accountStatus?.cpu.max || 0)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-2">
             {accountStatus ? `${t('resources.available')}: ${formatTime(accountStatus.cpu.available)}` : t('resources.notConnected')}
          </div>
        </div>

        {/* NET */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500 dark:text-slate-400">NET</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatBytes(accountStatus?.net.used || 0)} / {formatBytes(accountStatus?.net.max || 0)}
              </div>
            </div>
            <span className="text-sm text-slate-500">{getPercent(accountStatus?.net.used || 0, accountStatus?.net.max || 0).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${getPercent(accountStatus?.net.used || 0, accountStatus?.net.max || 0)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-2">
             {accountStatus ? `${t('resources.available')}: ${formatBytes(accountStatus.net.available)}` : t('resources.notConnected')}
          </div>
        </div>

        {/* RAM */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500 dark:text-slate-400">RAM</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                 {formatBytes(accountStatus?.ram.used || 0)} / {formatBytes(accountStatus?.ram.max || 0)}
              </div>
            </div>
            <span className="text-sm text-slate-500">{getPercent(accountStatus?.ram.used || 0, accountStatus?.ram.max || 0).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${getPercent(accountStatus?.ram.used || 0, accountStatus?.ram.max || 0)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-2">
             {accountStatus ? `${t('resources.available')}: ${formatBytes(accountStatus.ram.available)}` : t('resources.notConnected')}
          </div>
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
                {t('resources.stakeAction')}
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
                {t('resources.unstakeAction')}
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
                {t('resources.buyAction')}
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
                {t('resources.sellAction')}
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {getInputLabel()}
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={activeTab === 'ram' ? '0' : '0.0000'}
                className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
              <button
                onClick={setMax}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-600 dark:text-cyan-400 font-medium hover:underline"
              >
                {t('resources.maxAmount')}
              </button>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>{getAvailableLabel()}</span>
              <span>{getAvailable()}</span>
            </div>
          </div>

          {/* Receiver (for staking/buying RAM) */}
          {action === 'stake' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('resources.receiverAccount')} <span className="text-slate-400 font-normal">{t('resources.receiverOptional')}</span>
              </label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder={t('resources.receiverHint')}
                className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {getInfoText()}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <TransactionSuccess
                message={success.message}
                txId={success.txId}
                className="mb-6"
            />
          )}

          {/* Submit Button */}
          <button
            onClick={handleTransaction}
            disabled={loading || !connected}
            className={cn(
                "w-full h-12 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
                loading || !connected ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-cyan-500 text-white"
            )}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {getButtonText()}
          </button>
        </div>
      </div>

      {/* Pending Refunds */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('resources.pendingRefunds')}</h2>
          <button
            onClick={() => refreshAccountInfo()}
            className="text-sm text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            {t('resources.refresh')}
          </button>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          {accountStatus && accountStatus.refunding > 0 ? (
             <div className="text-lg text-slate-900 dark:text-white">{accountStatus.refunding.toFixed(4)} FO</div>
          ) : t('resources.noPendingRefunds')}
        </div>
      </div>
    </div>
  )
}
