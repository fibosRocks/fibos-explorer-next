'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileCode, ChevronDown, ChevronUp, User } from 'lucide-react'
import { lookupRenderer, CATEGORY_STYLES, useActionLabel } from '@/lib/transaction/action-renderers'
import type { Action } from '@/lib/services/types'
import { useTranslation } from '@/lib/i18n'

interface ActionCardDetailProps {
  action: Action
  index: number
}

export function ActionCardDetail({ action, index }: ActionCardDetailProps) {
  const { t } = useTranslation()
  const [rawOpen, setRawOpen] = useState(false)
  const renderer = lookupRenderer(action.account, action.name)
  const category = renderer?.category
  const styles = category ? CATEGORY_STYLES[category] : null
  const Icon = renderer?.icon ?? FileCode
  const label = useActionLabel(action.name)

  return (
    <div className="p-4">
      {/* Action Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles ? styles.bg : 'bg-purple-500/10'}`}>
          <Icon className={`w-5 h-5 ${styles ? styles.text : 'text-purple-500'}`} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold font-mono text-slate-900 dark:text-white">{action.name}</span>
            {label && (
              <span className="text-sm text-slate-500 dark:text-slate-400">· {label}</span>
            )}
            <span className="text-slate-400">@</span>
            <Link
              href={`/explorer/accounts/${action.account}`}
              className="font-mono text-purple-600 dark:text-cyan-400 hover:underline"
            >
              {action.account}
            </Link>
          </div>
          <div className="text-xs text-slate-400">Action #{index + 1}</div>
        </div>
      </div>

      {/* Authorization */}
      {action.authorization && action.authorization.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <User className="w-3 h-3" />
            {t('transaction.authorization')}
          </div>
          <div className="flex flex-wrap gap-2">
            {action.authorization.map((auth, authIndex) => (
              <Link
                key={authIndex}
                href={`/explorer/accounts/${auth.actor}`}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {auth.actor}@{auth.permission}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Parsed body or raw JSON */}
      {action.data && (
        <div>
          {renderer ? (
            <>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-2">
                <renderer.Detail account={action.account} name={action.name} data={action.data} />
              </div>
              <button
                onClick={() => setRawOpen(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {rawOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {rawOpen ? t('transaction.rawDataHide') : t('transaction.rawData')}
              </button>
              {rawOpen && (
                <div className="mt-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                    {JSON.stringify(action.data, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('transaction.data')}</div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                  {JSON.stringify(action.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ActionCardSummaryProps {
  action: Action
}

export function ActionCardSummary({ action }: ActionCardSummaryProps) {
  const renderer = lookupRenderer(action.account, action.name)
  const styles = renderer ? CATEGORY_STYLES[renderer.category] : null
  const label = useActionLabel(action.name)

  return (
    <div className="flex items-center justify-between gap-4 text-sm w-full">
      {/* Action badge + localized label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${styles ? `${styles.bg} ${styles.text}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
          {action.name}
        </span>
        {label && (
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">{label}</span>
        )}
      </div>

      {/* Summary or fallback */}
      <div className="flex-1 flex justify-end min-w-0 overflow-hidden">
        {renderer ? (
          <renderer.Summary account={action.account} name={action.name} data={action.data ?? {}} />
        ) : (
          <span className="text-slate-400 text-xs truncate max-w-[200px]" title={JSON.stringify(action.data)}>
            {action.account}
          </span>
        )}
      </div>
    </div>
  )
}
