'use client'

import { useState } from 'react'
import { Check, X, Play, Trash2, Shield, Loader2, AlertCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWalletStore } from '@/stores/walletStore'
import { TransactionSuccess } from '@/components/features/TransactionSuccess'

type MsigAction = 'approve' | 'unapprove' | 'exec' | 'cancel'

interface ProposalData {
  proposal_name: string
  packed_transaction: string
  earliest_exec_time?: string
}

export default function MultisigPage() {
  const { connected, account, connect, transact, getPermission } = useWalletStore()

  const [proposer, setProposer] = useState('')
  const [proposalName, setProposalName] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [proposalData, setProposalData] = useState<ProposalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; txId?: string } | null>(null)

  const handleFetchProposal = async () => {
    if (!proposer || !proposalName) {
        setError('请输入提案人和提案名称')
        return
    }

    setFetching(true)
    setError(null)
    setProposalData(null)
    setSuccess(null)

    try {
        const response = await fetch('/api/rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: '/v1/chain/get_table_rows',
              data: {
                json: true,
                code: 'eosio.msig',
                scope: proposer,
                table: 'proposal',
                lower_bound: proposalName,
                limit: 1
              },
            }),
        })

        if (!response.ok) throw new Error('查询失败')
        const data = await response.json()

        const row = data.rows?.[0]
        if (row && row.proposal_name === proposalName) {
            setProposalData(row)
        } else {
            setError('未找到该提案')
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : '查询失败')
    } finally {
        setFetching(false)
    }
  }

  const handleAction = async (action: MsigAction) => {
    if (!connected || !account) {
        connect()
        return
    }

    if (!proposer || !proposalName) {
        setError('请输入提案人和提案名称')
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
        let act = {
            account: 'eosio.msig',
            name: action,
            authorization: [permission],
            data: {}
        }

        if (action === 'approve' || action === 'unapprove') {
            act.data = {
                proposer,
                proposal_name: proposalName,
                level: permission // { actor, permission }
            }
        } else if (action === 'exec') {
            act.data = {
                proposer,
                proposal_name: proposalName,
                executer: account.name
            }
        } else if (action === 'cancel') {
            act.data = {
                proposer,
                proposal_name: proposalName,
                canceler: account.name
            }
        }

        const result = await transact([act])

        let msg = ''
        switch(action) {
            case 'approve': msg = '提案批准成功'; break;
            case 'unapprove': msg = '已取消批准'; break;
            case 'exec': msg = '提案执行成功'; break;
            case 'cancel': msg = '提案已取消'; break;
        }

        setSuccess({
            message: msg,
            txId: result.transaction_id
        })
    } catch (err) {
        setError(err instanceof Error ? err.message : '操作失败')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">多重签名</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">管理和执行多重签名提案</p>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">操作提案</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Proposer */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    提案人 (Proposer)
                </label>
                <input
                    type="text"
                    value={proposer}
                    onChange={(e) => setProposer(e.target.value.toLowerCase())}
                    placeholder="输入提案账户名"
                    className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
            </div>

            {/* Proposal Name */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    提案名称 (Proposal Name)
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={proposalName}
                        onChange={(e) => setProposalName(e.target.value)}
                        placeholder="输入提案名称"
                        className="flex-1 h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                    <button
                        onClick={handleFetchProposal}
                        disabled={fetching || !proposer || !proposalName}
                        className="h-12 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        查询
                    </button>
                </div>
            </div>
        </div>

        {/* Proposal Details */}
        {proposalData && (
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">提案详情</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">提案名称:</span>
                        <span className="font-mono text-slate-900 dark:text-white">{proposalData.proposal_name}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block mb-1">Packed Transaction:</span>
                        <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded text-xs font-mono break-all text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto">
                            {proposalData.packed_transaction}
                        </div>
                    </div>
                </div>
            </div>
        )}

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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
                onClick={() => handleAction('approve')}
                disabled={loading || !connected || !proposalData}
                className="h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                批准 (Approve)
            </button>
            <button
                onClick={() => handleAction('unapprove')}
                disabled={loading || !connected || !proposalData}
                className="h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                撤销 (Unapprove)
            </button>
            <button
                onClick={() => handleAction('exec')}
                disabled={loading || !connected || !proposalData}
                className="h-12 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-xl font-medium hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                执行 (Execute)
            </button>
            <button
                onClick={() => handleAction('cancel')}
                disabled={loading || !connected || !proposalData}
                className="h-12 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                取消 (Cancel)
            </button>
        </div>

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 mb-2 font-medium text-slate-700 dark:text-slate-300">
                <Shield className="w-4 h-4" />
                说明
            </div>
            <ul className="space-y-1 list-disc list-inside">
                <li>批准 (Approve): 同意该提案</li>
                <li>撤销 (Unapprove): 收回之前的同意</li>
                <li>执行 (Execute): 当收集到足够的签名后，执行该提案</li>
                <li>取消 (Cancel): 取消该提案（仅提案人或过期后可操作）</li>
            </ul>
        </div>
      </div>
    </div>
  )
}
