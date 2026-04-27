'use client'

import Link from 'next/link'
import {
  ArrowRightLeft,
  Database,
  Vote,
  Users,
  Key,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

// ==================== Types ====================

export interface ActionRendererContext {
  account: string
  name: string
  data: Record<string, unknown>
}

export type ActionCategory = 'token' | 'resource' | 'vote' | 'msig' | 'auth'

export interface ActionRenderer {
  key: string
  category: ActionCategory
  icon: LucideIcon
  Summary: React.FC<ActionRendererContext>
  Detail: React.FC<ActionRendererContext>
}

// ==================== Shared Helpers ====================

/**
 * 返回 action 名称的本地化语义标签（如 delegatebw → "抵押" / "Stake"）。
 * 未在 i18n 中登记的 action 名返回 null，调用方可决定是否显示。
 */
export function useActionLabel(name: string): string | null {
  const { t } = useTranslation()
  const key = `transaction.actionName.${name}`
  const value = t(key)
  return value === key ? null : value
}

function AccountLink({ name }: { name: string }) {
  if (!name || typeof name !== 'string') return <span className="font-mono">{String(name)}</span>
  return (
    <Link
      href={`/explorer/accounts/${name}`}
      className="font-mono text-purple-600 dark:text-cyan-400 hover:underline"
    >
      {name}
    </Link>
  )
}

function Amount({ value }: { value: unknown }) {
  return (
    <span className="font-medium whitespace-nowrap text-slate-900 dark:text-white">
      {String(value ?? '')}
    </span>
  )
}

function Arrow() {
  return <span className="text-slate-400 mx-1">→</span>
}

function Separator() {
  return <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5 text-sm">{children}</div>
    </div>
  )
}

// ==================== Token Renderers ====================

const TransferSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { from?: string; to?: string; quantity?: string; memo?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.from ?? ''} />
      <Arrow />
      <AccountLink name={d.to ?? ''} />
      <Separator />
      <Amount value={d.quantity} />
      {d.memo && (
        <span className="text-slate-400 text-xs italic truncate max-w-[150px] hidden md:inline-block" title={d.memo}>
          {d.memo}
        </span>
      )}
    </div>
  )
}

const TransferDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { from?: string; to?: string; quantity?: string; memo?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.from')}><AccountLink name={d.from ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.to')}><AccountLink name={d.to ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.quantity')}><Amount value={d.quantity} /></DetailRow>
      {d.memo && <DetailRow label={t('transaction.action.memo')}><span className="text-slate-700 dark:text-slate-300 break-all">{d.memo}</span></DetailRow>}
    </div>
  )
}

const ExtransferSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { from?: string; to?: string; quantity?: { quantity?: string; contract?: string }; memo?: string }
  const qty = d.quantity ? `${d.quantity.quantity}@${d.quantity.contract}` : ''
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.from ?? ''} />
      <Arrow />
      <AccountLink name={d.to ?? ''} />
      <Separator />
      <Amount value={qty} />
      {d.memo && (
        <span className="text-slate-400 text-xs italic truncate max-w-[150px] hidden md:inline-block" title={d.memo}>
          {d.memo}
        </span>
      )}
    </div>
  )
}

const ExtransferDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { from?: string; to?: string; quantity?: { quantity?: string; contract?: string }; memo?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.from')}><AccountLink name={d.from ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.to')}><AccountLink name={d.to ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.quantity')}>
        <Amount value={d.quantity?.quantity} />
        <span className="text-slate-400">@</span>
        <AccountLink name={d.quantity?.contract ?? ''} />
      </DetailRow>
      {d.memo && <DetailRow label={t('transaction.action.memo')}><span className="text-slate-700 dark:text-slate-300 break-all">{d.memo}</span></DetailRow>}
    </div>
  )
}

const IssueSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { to?: string; quantity?: string; memo?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <Arrow />
      <AccountLink name={d.to ?? ''} />
      <Separator />
      <Amount value={d.quantity} />
    </div>
  )
}

const IssueDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { to?: string; quantity?: string; memo?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.to')}><AccountLink name={d.to ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.quantity')}><Amount value={d.quantity} /></DetailRow>
      {d.memo && <DetailRow label={t('transaction.action.memo')}><span className="text-slate-700 dark:text-slate-300 break-all">{d.memo}</span></DetailRow>}
    </div>
  )
}

// ==================== Resource Renderers ====================

const BuyRamSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { payer?: string; receiver?: string; quant?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.payer ?? ''} />
      <Arrow />
      <AccountLink name={d.receiver ?? ''} />
      <Separator />
      <Amount value={d.quant} />
    </div>
  )
}

const BuyRamDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { payer?: string; receiver?: string; quant?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.payer')}><AccountLink name={d.payer ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.receiver')}><AccountLink name={d.receiver ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.quant')}><Amount value={d.quant} /></DetailRow>
    </div>
  )
}

const BuyRamBytesSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { payer?: string; receiver?: string; bytes?: number }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.payer ?? ''} />
      <Arrow />
      <AccountLink name={d.receiver ?? ''} />
      <Separator />
      <Amount value={d.bytes != null ? `${d.bytes} B` : ''} />
    </div>
  )
}

const BuyRamBytesDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { payer?: string; receiver?: string; bytes?: number }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.payer')}><AccountLink name={d.payer ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.receiver')}><AccountLink name={d.receiver ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.bytes')}><Amount value={d.bytes} /></DetailRow>
    </div>
  )
}

const SellRamSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { account?: string; bytes?: number }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.account ?? ''} />
      <Separator />
      <Amount value={d.bytes != null ? `-${d.bytes} B` : ''} />
    </div>
  )
}

const SellRamDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { account?: string; bytes?: number }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.owner')}><AccountLink name={d.account ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.bytes')}><Amount value={d.bytes} /></DetailRow>
    </div>
  )
}

const DelegateBwSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { from?: string; receiver?: string; stake_net_quantity?: string; stake_cpu_quantity?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.from ?? ''} />
      <Arrow />
      <AccountLink name={d.receiver ?? ''} />
      <Separator />
      <span className="text-xs text-slate-500">NET</span>
      <Amount value={d.stake_net_quantity} />
      <span className="text-xs text-slate-500">CPU</span>
      <Amount value={d.stake_cpu_quantity} />
    </div>
  )
}

const DelegateBwDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { from?: string; receiver?: string; stake_net_quantity?: string; stake_cpu_quantity?: string; transfer?: boolean | number }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.from')}><AccountLink name={d.from ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.receiver')}><AccountLink name={d.receiver ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.stakeNet')}><Amount value={d.stake_net_quantity} /></DetailRow>
      <DetailRow label={t('transaction.action.stakeCpu')}><Amount value={d.stake_cpu_quantity} /></DetailRow>
      <DetailRow label={t('transaction.action.transferStake')}>
        <span className="text-slate-700 dark:text-slate-300">
          {d.transfer ? t('transaction.action.yes') : t('transaction.action.no')}
        </span>
      </DetailRow>
    </div>
  )
}

const UndelegateBwSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { from?: string; receiver?: string; unstake_net_quantity?: string; unstake_cpu_quantity?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.from ?? ''} />
      <Arrow />
      <AccountLink name={d.receiver ?? ''} />
      <Separator />
      <span className="text-xs text-slate-500">NET</span>
      <Amount value={d.unstake_net_quantity} />
      <span className="text-xs text-slate-500">CPU</span>
      <Amount value={d.unstake_cpu_quantity} />
    </div>
  )
}

const UndelegateBwDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { from?: string; receiver?: string; unstake_net_quantity?: string; unstake_cpu_quantity?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.from')}><AccountLink name={d.from ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.receiver')}><AccountLink name={d.receiver ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.unstakeNet')}><Amount value={d.unstake_net_quantity} /></DetailRow>
      <DetailRow label={t('transaction.action.unstakeCpu')}><Amount value={d.unstake_cpu_quantity} /></DetailRow>
    </div>
  )
}

// ==================== Vote Renderers ====================

const VoteProducerSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { voter?: string; proxy?: string; producers?: string[] }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.voter ?? ''} />
      <Separator />
      {d.proxy ? (
        <>
          <span className="text-slate-400 text-xs">{t('transaction.action.voteViaProxy')}</span>
          <AccountLink name={d.proxy} />
        </>
      ) : (
        <span className="text-slate-500 text-xs">
          {t('transaction.action.producersCount').replace('{count}', String(d.producers?.length ?? 0))}
        </span>
      )}
    </div>
  )
}

const VoteProducerDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { voter?: string; proxy?: string; producers?: string[] }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.voter')}><AccountLink name={d.voter ?? ''} /></DetailRow>
      {d.proxy ? (
        <DetailRow label={t('transaction.action.proxy')}><AccountLink name={d.proxy} /></DetailRow>
      ) : (
        <DetailRow label={t('transaction.action.producers')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.producers ?? []).map((p, i) => (
              <AccountLink key={i} name={p} />
            ))}
          </div>
        </DetailRow>
      )}
    </div>
  )
}

const RegProxySummary: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { proxy?: string; isproxy?: boolean | number }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.proxy ?? ''} />
      <Separator />
      <span className="text-slate-500 text-xs">
        {d.isproxy ? t('transaction.action.register') : t('transaction.action.unregister')}
      </span>
    </div>
  )
}

const RegProxyDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { proxy?: string; isproxy?: boolean | number }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.proxy')}><AccountLink name={d.proxy ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.isproxy')}>
        <span className="text-slate-700 dark:text-slate-300">
          {d.isproxy ? t('transaction.action.yes') : t('transaction.action.no')}
        </span>
      </DetailRow>
    </div>
  )
}

const RegProducerSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { producer?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.producer ?? ''} />
      <Separator />
      <span className="text-slate-500 text-xs">{t('transaction.action.register')}</span>
    </div>
  )
}

const RegProducerDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { producer?: string; producer_key?: string; url?: string; location?: number }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.owner')}><AccountLink name={d.producer ?? ''} /></DetailRow>
      {d.url && <DetailRow label={t('transaction.action.url')}><span className="text-slate-700 dark:text-slate-300 break-all">{d.url}</span></DetailRow>}
      {d.location != null && <DetailRow label={t('transaction.action.location')}><span className="text-slate-700 dark:text-slate-300">{d.location}</span></DetailRow>}
    </div>
  )
}

const ClaimRewardsSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { owner?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.owner ?? ''} />
      <Separator />
      <span className="text-slate-500 text-xs">{t('transaction.action.claim')}</span>
    </div>
  )
}

const ClaimRewardsDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { owner?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.owner')}><AccountLink name={d.owner ?? ''} /></DetailRow>
    </div>
  )
}

// ==================== Multisig Renderers ====================

const MsigProposeSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { proposer?: string; proposal_name?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.proposer ?? ''} />
      <Separator />
      <span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span>
    </div>
  )
}

const MsigProposeDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { proposer?: string; proposal_name?: string; requested?: Array<{ actor?: string; permission?: string }> }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.proposer')}><AccountLink name={d.proposer ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.proposalName')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span></DetailRow>
      {d.requested && d.requested.length > 0 && (
        <DetailRow label={t('transaction.action.requested')}>
          <div className="flex flex-wrap gap-1.5">
            {d.requested.map((r, i) => (
              <span key={i} className="inline-flex items-center gap-0.5">
                <AccountLink name={r.actor ?? ''} />
                <span className="text-slate-400 text-xs">@{r.permission}</span>
              </span>
            ))}
          </div>
        </DetailRow>
      )}
    </div>
  )
}

const MsigApproveSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { proposer?: string; proposal_name?: string; level?: { actor?: string; permission?: string } }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.level?.actor ?? ''} />
      <Separator />
      <span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span>
    </div>
  )
}

const MsigApproveDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { proposer?: string; proposal_name?: string; level?: { actor?: string; permission?: string } }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.proposer')}><AccountLink name={d.proposer ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.proposalName')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span></DetailRow>
      <DetailRow label={t('transaction.action.level')}>
        <AccountLink name={d.level?.actor ?? ''} />
        <span className="text-slate-400 text-xs">@{d.level?.permission}</span>
      </DetailRow>
    </div>
  )
}

const MsigCancelSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { proposer?: string; proposal_name?: string; canceler?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.canceler ?? d.proposer ?? ''} />
      <Separator />
      <span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span>
    </div>
  )
}

const MsigCancelDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { proposer?: string; proposal_name?: string; canceler?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.proposer')}><AccountLink name={d.proposer ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.proposalName')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span></DetailRow>
      <DetailRow label={t('transaction.action.canceler')}><AccountLink name={d.canceler ?? ''} /></DetailRow>
    </div>
  )
}

const MsigExecSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { proposer?: string; proposal_name?: string; executer?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.executer ?? d.proposer ?? ''} />
      <Separator />
      <span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span>
    </div>
  )
}

const MsigExecDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { proposer?: string; proposal_name?: string; executer?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.proposer')}><AccountLink name={d.proposer ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.proposalName')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.proposal_name}</span></DetailRow>
      <DetailRow label={t('transaction.action.executer')}><AccountLink name={d.executer ?? ''} /></DetailRow>
    </div>
  )
}

// ==================== Auth Renderers ====================

const NewAccountSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { creator?: string; name?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.creator ?? ''} />
      <Arrow />
      <AccountLink name={d.name ?? ''} />
    </div>
  )
}

const NewAccountDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as {
    creator?: string
    name?: string
    owner?: { threshold?: number; keys?: Array<{ key: string; weight: number }>; accounts?: Array<{ permission: { actor: string; permission: string }; weight: number }> }
    active?: { threshold?: number; keys?: Array<{ key: string; weight: number }>; accounts?: Array<{ permission: { actor: string; permission: string }; weight: number }> }
  }
  const renderPerm = (perm: typeof d.owner) => (
    <div className="space-y-1">
      {perm?.keys?.map((k, i) => (
        <div key={i} className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">{k.key}</div>
      ))}
      {perm?.accounts?.map((a, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          <AccountLink name={a.permission.actor} />
          <span className="text-slate-400 text-xs">@{a.permission.permission}</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.creator')}><AccountLink name={d.creator ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.newAccount')}><AccountLink name={d.name ?? ''} /></DetailRow>
      {d.owner && <DetailRow label="Owner">{renderPerm(d.owner)}</DetailRow>}
      {d.active && <DetailRow label="Active">{renderPerm(d.active)}</DetailRow>}
    </div>
  )
}

const UpdateAuthSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { account?: string; permission?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.account ?? ''} />
      <Separator />
      <span className="text-xs font-mono text-slate-500">{d.permission}</span>
    </div>
  )
}

const UpdateAuthDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as {
    account?: string
    permission?: string
    parent?: string
    auth?: { threshold?: number; keys?: Array<{ key: string; weight: number }>; accounts?: Array<{ permission: { actor: string; permission: string }; weight: number }> }
  }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.owner')}><AccountLink name={d.account ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.permission')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.permission}</span></DetailRow>
      {d.parent && <DetailRow label={t('transaction.action.parent')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.parent}</span></DetailRow>}
      {d.auth?.threshold != null && <DetailRow label={t('transaction.action.threshold')}><span className="text-slate-700 dark:text-slate-300">{d.auth.threshold}</span></DetailRow>}
      {d.auth?.keys && d.auth.keys.length > 0 && (
        <DetailRow label={t('transaction.action.keys')}>
          <div className="space-y-1">
            {d.auth.keys.map((k, i) => <div key={i} className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">{k.key}</div>)}
          </div>
        </DetailRow>
      )}
      {d.auth?.accounts && d.auth.accounts.length > 0 && (
        <DetailRow label={t('transaction.action.accounts')}>
          <div className="flex flex-wrap gap-1.5">
            {d.auth.accounts.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-0.5">
                <AccountLink name={a.permission.actor} />
                <span className="text-slate-400 text-xs">@{a.permission.permission}</span>
              </span>
            ))}
          </div>
        </DetailRow>
      )}
    </div>
  )
}

const DeleteAuthSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { account?: string; permission?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.account ?? ''} />
      <Separator />
      <span className="text-xs font-mono text-slate-500">{d.permission}</span>
    </div>
  )
}

const DeleteAuthDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { account?: string; permission?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.owner')}><AccountLink name={d.account ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.permission')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.permission}</span></DetailRow>
    </div>
  )
}

const LinkAuthSummary: React.FC<ActionRendererContext> = ({ data }) => {
  const d = data as { account?: string; code?: string; type?: string }
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <AccountLink name={d.account ?? ''} />
      <Separator />
      <AccountLink name={d.code ?? ''} />
      <span className="text-slate-400 text-xs">::{d.type}</span>
    </div>
  )
}

const LinkAuthDetail: React.FC<ActionRendererContext> = ({ data }) => {
  const { t } = useTranslation()
  const d = data as { account?: string; code?: string; type?: string; requirement?: string }
  return (
    <div className="space-y-0.5">
      <DetailRow label={t('transaction.action.owner')}><AccountLink name={d.account ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.code')}><AccountLink name={d.code ?? ''} /></DetailRow>
      <DetailRow label={t('transaction.action.type')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.type}</span></DetailRow>
      {d.requirement && <DetailRow label={t('transaction.action.requirement')}><span className="font-mono text-slate-700 dark:text-slate-300">{d.requirement}</span></DetailRow>}
    </div>
  )
}

// ==================== Registry ====================

const RENDERERS: ActionRenderer[] = [
  // Token
  { key: '*::transfer', category: 'token', icon: ArrowRightLeft, Summary: TransferSummary, Detail: TransferDetail },
  { key: 'eosio.token::extransfer', category: 'token', icon: ArrowRightLeft, Summary: ExtransferSummary, Detail: ExtransferDetail },
  { key: 'eosio.token::issue', category: 'token', icon: ArrowRightLeft, Summary: IssueSummary, Detail: IssueDetail },

  // Resource
  { key: 'eosio::buyram', category: 'resource', icon: Database, Summary: BuyRamSummary, Detail: BuyRamDetail },
  { key: 'eosio::buyrambytes', category: 'resource', icon: Database, Summary: BuyRamBytesSummary, Detail: BuyRamBytesDetail },
  { key: 'eosio::sellram', category: 'resource', icon: Database, Summary: SellRamSummary, Detail: SellRamDetail },
  { key: 'eosio::delegatebw', category: 'resource', icon: Database, Summary: DelegateBwSummary, Detail: DelegateBwDetail },
  { key: 'eosio::undelegatebw', category: 'resource', icon: Database, Summary: UndelegateBwSummary, Detail: UndelegateBwDetail },

  // Vote
  { key: 'eosio::voteproducer', category: 'vote', icon: Vote, Summary: VoteProducerSummary, Detail: VoteProducerDetail },
  { key: 'eosio::regproxy', category: 'vote', icon: Vote, Summary: RegProxySummary, Detail: RegProxyDetail },
  { key: 'eosio::regproducer', category: 'vote', icon: Vote, Summary: RegProducerSummary, Detail: RegProducerDetail },
  { key: 'eosio::claimrewards', category: 'vote', icon: Vote, Summary: ClaimRewardsSummary, Detail: ClaimRewardsDetail },

  // Multisig
  { key: 'eosio.msig::propose', category: 'msig', icon: Users, Summary: MsigProposeSummary, Detail: MsigProposeDetail },
  { key: 'eosio.msig::approve', category: 'msig', icon: Users, Summary: MsigApproveSummary, Detail: MsigApproveDetail },
  { key: 'eosio.msig::unapprove', category: 'msig', icon: Users, Summary: MsigApproveSummary, Detail: MsigApproveDetail },
  { key: 'eosio.msig::cancel', category: 'msig', icon: Users, Summary: MsigCancelSummary, Detail: MsigCancelDetail },
  { key: 'eosio.msig::exec', category: 'msig', icon: Users, Summary: MsigExecSummary, Detail: MsigExecDetail },

  // Auth
  { key: 'eosio::newaccount', category: 'auth', icon: Key, Summary: NewAccountSummary, Detail: NewAccountDetail },
  { key: 'eosio::updateauth', category: 'auth', icon: Key, Summary: UpdateAuthSummary, Detail: UpdateAuthDetail },
  { key: 'eosio::deleteauth', category: 'auth', icon: Key, Summary: DeleteAuthSummary, Detail: DeleteAuthDetail },
  { key: 'eosio::linkauth', category: 'auth', icon: Key, Summary: LinkAuthSummary, Detail: LinkAuthDetail },
  { key: 'eosio::unlinkauth', category: 'auth', icon: Key, Summary: LinkAuthSummary, Detail: LinkAuthDetail },
]

const exactMap = new Map<string, ActionRenderer>()
const wildcardMap = new Map<string, ActionRenderer>()

for (const r of RENDERERS) {
  if (r.key.startsWith('*::')) {
    wildcardMap.set(r.key.slice(3), r)
  } else {
    exactMap.set(r.key, r)
  }
}

export function lookupRenderer(account: string, name: string): ActionRenderer | null {
  return exactMap.get(`${account}::${name}`) ?? wildcardMap.get(name) ?? null
}

export const CATEGORY_STYLES: Record<ActionCategory, { bg: string; text: string }> = {
  token: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  resource: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  vote: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
  msig: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  auth: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' },
}
