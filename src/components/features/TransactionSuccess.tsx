'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

interface TransactionSuccessProps {
  message: string
  txId?: string
  className?: string
}

export function TransactionSuccess({ message, txId, className }: TransactionSuccessProps) {
  const { t } = useTranslation()

  return (
    <div className={`p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm ${className || ''}`}>
      <p>{message}</p>
      {txId && (
        <div className="mt-1">
          <Link
            href={`/explorer/transactions?id=${txId}`}
            className="underline hover:text-emerald-500 font-mono break-all"
          >
            {t('transaction.txId')}: {txId}
          </Link>
        </div>
      )}
    </div>
  )
}
