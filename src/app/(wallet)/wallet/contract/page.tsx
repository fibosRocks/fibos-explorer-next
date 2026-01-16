'use client'

import { useState } from 'react'
import { Code, Send, Play, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWalletStore } from '@/stores/walletStore'
import { TransactionSuccess } from '@/components/features/TransactionSuccess'

export default function ContractPage() {
  const { connected, account, connect, transact, getPermission } = useWalletStore()

  const [contractName, setContractName] = useState('')
  const [actionName, setActionName] = useState('')
  const [jsonPayload, setJsonPayload] = useState('{\n  \n}')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; txId?: string } | null>(null)

  const handleSendTransaction = async () => {
    if (!connected || !account) {
        connect()
        return
    }

    if (!contractName || !actionName) {
        setError('请输入合约名和 Action 名')
        return
    }

    let data = {}
    try {
        data = JSON.parse(jsonPayload)
    } catch (e) {
        setError('JSON 数据格式错误')
        return
    }

    const permission = getPermission()
    if (!permission) {
        setError('无法获取权限')
        return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
        const result = await transact([{
            account: contractName,
            name: actionName,
            authorization: [permission],
            data,
        }])

        setSuccess({
            message: '交易发送成功！',
            txId: result.transaction_id
        })
    } catch (err) {
        setError(err instanceof Error ? err.message : '交易失败')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">合约调用</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">直接调用智能合约接口执行操作</p>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contract Account */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    合约账户
                </label>
                <input
                    type="text"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value.toLowerCase())}
                    placeholder="例如: eosio.token"
                    className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono"
                />
            </div>

            {/* Action Name */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Action 名称
                </label>
                <input
                    type="text"
                    value={actionName}
                    onChange={(e) => setActionName(e.target.value.toLowerCase())}
                    placeholder="例如: transfer"
                    className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono"
                />
            </div>
        </div>

        {/* JSON Data */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Action 数据 (JSON)
            </label>
            <textarea
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                placeholder='{ "key": "value" }'
                className="w-full h-64 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm leading-relaxed"
                spellCheck={false}
            />
            <p className="text-xs text-slate-400 mt-2">请输入符合合约 ABI 定义的 JSON 参数</p>
        </div>

        {/* Permission Info */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Code className="w-4 h-4" />
                <span>授权: </span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {connected && account ? `${account.name}@${account.authority}` : '未连接'}
                </span>
            </div>
            {!connected && (
                <button onClick={() => connect()} className="text-sm text-purple-600 dark:text-cyan-400 hover:underline">
                    连接钱包
                </button>
            )}
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
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
            onClick={handleSendTransaction}
            disabled={loading || !connected || !contractName || !actionName}
            className={cn(
                "w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                loading || !connected
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90"
            )}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            执行合约
        </button>
      </div>
    </div>
  )
}
