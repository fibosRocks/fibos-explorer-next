'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, X, Play, Trash2, Shield, Loader2, AlertCircle, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useWalletStore } from '@/stores/walletStore'
import { TransactionSuccess } from '@/components/features/TransactionSuccess'
import { useTranslation } from '@/lib/i18n'
import { parsePackedTransaction } from '@/lib/api/client'
import { environment } from '@/lib/config/environment'

type MsigAction = 'approve' | 'unapprove' | 'exec' | 'cancel'

interface ApprovalLevel {
  actor: string
  permission: string
}

interface ApprovalStatus {
  actor: string
  permission: string
  status: 'approved' | 'unapproved'
}

interface ParsedAction {
  account: string
  name: string
  authorization: { actor: string; permission: string }[]
  data: Record<string, unknown>
}

interface ParsedTransaction {
  expiration: string
  ref_block_num: number
  ref_block_prefix: number
  actions: ParsedAction[]
}

interface ProposalData {
  proposal_name: string
  provided_approvals: { level: ApprovalLevel }[]
  requested_approvals: { level: ApprovalLevel }[]
  status: ApprovalStatus[]
  tx?: {
    packed_transaction: string
    parsed?: ParsedTransaction
    parsing?: boolean
    parseError?: string
  }
  open?: boolean
}

function MultisigContent() {
  const { t } = useTranslation()
  const { connected, account, connect, transact, getPermission } = useWalletStore()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [proposer, setProposer] = useState('')
  const [proposalName, setProposalName] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [proposalList, setProposalList] = useState<ProposalData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; txId?: string } | null>(null)

  // 从 URL 参数初始化并自动查询
  useEffect(() => {
    const urlProposer = searchParams.get('proposer')
    const urlProposal = searchParams.get('proposal')

    if (urlProposer) {
      setProposer(urlProposer)
      if (urlProposal) {
        setProposalName(urlProposal)
      }
    }
  }, [searchParams])

  // 更新 URL 参数
  const updateUrl = useCallback((newProposer: string, newProposalName: string) => {
    const params = new URLSearchParams()
    if (newProposer) params.set('proposer', newProposer)
    if (newProposalName) params.set('proposal', newProposalName)

    const queryString = params.toString()
    router.replace(queryString ? `?${queryString}` : '/wallet/multisig', { scroll: false })
  }, [router])

  const handleFetchProposal = useCallback(async (searchProposer?: string, searchProposalName?: string) => {
    const targetProposer = searchProposer ?? proposer
    const targetProposalName = searchProposalName ?? proposalName

    if (!targetProposer) {
        setError(t('multisig.errorNoProposer'))
        return
    }

    // 更新 URL
    updateUrl(targetProposer, targetProposalName)

    setFetching(true)
    setError(null)
    setProposalList([])
    setSuccess(null)

    try {
        // 1. 查询 approvals2 表获取批准状态
        const approvalsResponse = await fetch(`${environment.blockchainUrl}/v1/chain/get_table_rows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                json: true,
                code: 'eosio.msig',
                scope: targetProposer,
                table: 'approvals2',
                lower_bound: targetProposalName || undefined,
                limit: targetProposalName ? 1 : 100
            }),
        })

        if (!approvalsResponse.ok) throw new Error(t('multisig.errorQueryFailed'))
        const approvalsData = await approvalsResponse.json()

        let rows = approvalsData.rows || []

        // 如果指定了 proposalName，精确匹配
        if (targetProposalName && rows.length > 0) {
            rows = rows.filter((r: any) => r.proposal_name === targetProposalName)
        }

        if (rows.length === 0) {
            setError(t('multisig.notFound'))
            setFetching(false)
            return
        }

        // 处理批准状态
        const proposals: ProposalData[] = rows.map((proposal: any) => {
            const status: ApprovalStatus[] = []

            // 已批准的
            proposal.provided_approvals?.forEach((approval: any) => {
                const level = approval.level || approval
                status.push({
                    actor: level.actor,
                    permission: level.permission,
                    status: 'approved'
                })
            })

            // 待批准的
            proposal.requested_approvals?.forEach((approval: any) => {
                const level = approval.level || approval
                status.push({
                    actor: level.actor,
                    permission: level.permission,
                    status: 'unapproved'
                })
            })

            return {
                ...proposal,
                status,
                open: false
            }
        })

        // 2. 查询 proposal 表获取交易详情
        const proposalResponse = await fetch(`${environment.blockchainUrl}/v1/chain/get_table_rows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                json: true,
                code: 'eosio.msig',
                scope: targetProposer,
                table: 'proposal',
                lower_bound: targetProposalName || undefined,
                limit: targetProposalName ? 1 : 100
            }),
        })

        if (proposalResponse.ok) {
            const proposalData = await proposalResponse.json()
            const proposalDetails = proposalData.rows || []

            // 合并交易详情到提案列表
            proposalDetails.forEach((detail: any) => {
                const idx = proposals.findIndex(p => p.proposal_name === detail.proposal_name)
                if (idx !== -1 && proposals[idx]) {
                    proposals[idx].tx = {
                        packed_transaction: detail.packed_transaction
                    }
                }
            })
        }

        setProposalList(proposals)
    } catch (err) {
        setError(err instanceof Error ? err.message : t('multisig.errorQueryFailed'))
    } finally {
        setFetching(false)
    }
  }, [proposer, proposalName, updateUrl, t])

  // URL 参数变化时自动查询
  useEffect(() => {
    const urlProposer = searchParams.get('proposer')
    const urlProposal = searchParams.get('proposal')

    if (urlProposer) {
      handleFetchProposal(urlProposer, urlProposal || '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleProposal = async (name: string) => {
    const proposal = proposalList.find(p => p.proposal_name === name)

    // 如果正在打开且还没有解析过，则开始解析
    if (proposal && !proposal.open && proposal.tx?.packed_transaction && !proposal.tx.parsed && !proposal.tx.parsing) {
      // 先标记为正在解析
      setProposalList(prev => prev.map(p =>
        p.proposal_name === name
          ? { ...p, open: true, tx: { ...p.tx!, parsing: true } }
          : p
      ))

      try {
        const parsed = await parsePackedTransaction(proposal.tx.packed_transaction)
        setProposalList(prev => prev.map(p =>
          p.proposal_name === name
            ? { ...p, tx: { ...p.tx!, parsed, parsing: false } }
            : p
        ))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('multisig.parseError')
        setProposalList(prev => prev.map(p =>
          p.proposal_name === name
            ? { ...p, tx: { ...p.tx!, parseError: errorMessage, parsing: false } }
            : p
        ))
      }
    } else {
      // 简单切换展开状态
      setProposalList(prev => prev.map(p =>
        p.proposal_name === name ? { ...p, open: !p.open } : p
      ))
    }
  }

  const handleAction = async (action: MsigAction, proposal: ProposalData) => {
    if (!connected || !account) {
        connect()
        return
    }

    if (!proposer) {
        setError(t('multisig.errorNoProposer'))
        return
    }

    const permission = getPermission()
    if (!permission) {
        setError(t('multisig.errorNoPermission'))
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
            data: {} as any
        }

        if (action === 'approve' || action === 'unapprove') {
            act.data = {
                proposer,
                proposal_name: proposal.proposal_name,
                level: permission
            }
        } else if (action === 'exec') {
            act.data = {
                proposer,
                proposal_name: proposal.proposal_name,
                executer: account.name
            }
        } else if (action === 'cancel') {
            act.data = {
                proposer,
                proposal_name: proposal.proposal_name,
                canceler: account.name
            }
        }

        const result = await transact([act])

        let msg = ''
        switch(action) {
            case 'approve': msg = t('multisig.successApprove'); break;
            case 'unapprove': msg = t('multisig.successUnapprove'); break;
            case 'exec': msg = t('multisig.successExec'); break;
            case 'cancel': msg = t('multisig.successCancel'); break;
        }

        setSuccess({
            message: msg,
            txId: result.transaction_id
        })

        // 刷新列表
        setTimeout(() => handleFetchProposal(), 1000)
    } catch (err) {
        setError(err instanceof Error ? err.message : t('multisig.errorActionFailed'))
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('multisig.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('multisig.subtitle')}</p>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{t('multisig.queryProposal')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Proposer */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('multisig.proposer')}
                </label>
                <input
                    type="text"
                    value={proposer}
                    onChange={(e) => setProposer(e.target.value.toLowerCase())}
                    placeholder={t('multisig.proposerPlaceholder')}
                    className="w-full h-12 md:h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
            </div>

            {/* Proposal Name */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('multisig.proposalNameOptional')}
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={proposalName}
                        onChange={(e) => setProposalName(e.target.value)}
                        placeholder={t('multisig.proposalPlaceholder')}
                        className="flex-1 h-12 md:h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                    <button
                        onClick={() => handleFetchProposal()}
                        disabled={fetching || !proposer}
                        className="h-12 md:h-11 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {t('multisig.query')}
                    </button>
                </div>
            </div>
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

        {/* Proposal List */}
        {proposalList.length > 0 && (
            <div className="space-y-4">
                {proposalList.map((proposal) => (
                    <div
                        key={proposal.proposal_name}
                        className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                    >
                        {/* Proposal Header */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                                    {proposal.proposal_name}
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {t('multisig.progress')}: {proposal.provided_approvals?.length || 0} / {proposal.status?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAction('approve', proposal)}
                                    disabled={loading || !connected}
                                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    {t('multisig.approve')}
                                </button>
                                <button
                                    onClick={() => handleAction('unapprove', proposal)}
                                    disabled={loading || !connected}
                                    className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    {t('multisig.unapprove')}
                                </button>
                                <button
                                    onClick={() => handleAction('exec', proposal)}
                                    disabled={loading || !connected}
                                    className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg text-sm font-medium hover:bg-purple-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    {t('multisig.execute')}
                                </button>
                                <button
                                    onClick={() => handleAction('cancel', proposal)}
                                    disabled={loading || !connected}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {t('multisig.cancel')}
                                </button>
                            </div>
                        </div>

                        {/* Proposal Body */}
                        <div className="p-4 space-y-4">
                            {/* Transaction Details */}
                            {proposal.tx && (
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleProposal(proposal.proposal_name)}
                                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {proposal.open ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                        {t('multisig.txDetails')}
                                    </button>
                                    {proposal.open && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 space-y-3">
                                            {/* 正在解析 */}
                                            {proposal.tx.parsing && (
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t('multisig.parsing')}
                                                </div>
                                            )}

                                            {/* 解析错误 */}
                                            {proposal.tx.parseError && (
                                                <div className="text-sm text-amber-600 dark:text-amber-400">
                                                    {proposal.tx.parseError}
                                                    <div className="mt-2">
                                                        <pre className="text-xs font-mono text-slate-500 overflow-x-auto whitespace-pre-wrap break-all">
                                                            {proposal.tx.packed_transaction}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 解析成功后显示 actions */}
                                            {proposal.tx.parsed && (
                                                <div className="space-y-3">
                                                    {proposal.tx.parsed.actions.map((action, idx) => (
                                                        <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                            {/* Action 头部 */}
                                                            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">#{idx + 1}</span>
                                                                <span className="font-mono text-sm text-purple-600 dark:text-cyan-400">{action.account}</span>
                                                                <span className="text-slate-400">::</span>
                                                                <span className="font-medium text-sm text-slate-900 dark:text-white">{action.name}</span>
                                                            </div>
                                                            {/* Action 授权 */}
                                                            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">{t('multisig.authorization')}: </span>
                                                                {action.authorization.map((auth, authIdx) => (
                                                                    <span key={authIdx} className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                                                        {authIdx > 0 && ', '}
                                                                        {auth.actor}@{auth.permission}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            {/* Action 数据 */}
                                                            <div className="px-3 py-2">
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('multisig.data')}:</div>
                                                                <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                                                                    {typeof action.data === 'object'
                                                                        ? JSON.stringify(action.data, null, 2)
                                                                        : String(action.data)
                                                                    }
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 如果还没解析也没错误，显示原始数据 */}
                                            {!proposal.tx.parsed && !proposal.tx.parseError && !proposal.tx.parsing && (
                                                <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap break-all">
                                                    {proposal.tx.packed_transaction}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Approval Status Table */}
                            {proposal.status && proposal.status.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{t('multisig.account')}</th>
                                                <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{t('multisig.permission')}</th>
                                                <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{t('multisig.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {proposal.status.map((approval, idx) => (
                                                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                    <td className="py-2 px-3 font-mono text-slate-900 dark:text-white">{approval.actor}</td>
                                                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{approval.permission}</td>
                                                    <td className="py-2 px-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                            approval.status === 'approved'
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                        }`}>
                                                            {approval.status === 'approved' ? t('multisig.approved') : t('multisig.unapproved')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 mb-2 font-medium text-slate-700 dark:text-slate-300">
                <Shield className="w-4 h-4" />
                {t('multisig.info')}
            </div>
            <p>{t('multisig.infoText')}</p>
        </div>
      </div>
    </div>
  )
}

export default function MultisigPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <MultisigContent />
    </Suspense>
  )
}
