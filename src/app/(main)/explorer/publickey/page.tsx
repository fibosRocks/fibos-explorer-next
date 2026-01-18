'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Key, User, ArrowRight, Loader2 } from 'lucide-react'
import * as eos from '@/lib/services/eos'
import { useTranslation } from '@/lib/i18n'

/**
 * 公钥查询页面
 *
 * 数据来源 (参考老项目 eos.service.ts):
 * - eos.getKeyAccounts(publicKey) -> { account_names: string[] }
 *
 * 该方法返回使用指定公钥的所有账户列表
 */

function PublicKeyContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const key = searchParams.get('key') || ''
  const decodedKey = decodeURIComponent(key)

  const [accounts, setAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const result = await eos.getKeyAccounts(decodedKey)
        setAccounts(result.account_names || [])
      } catch (err) {
        console.error('获取公钥关联账户失败:', err)
        setError(t('publicKey.fetchError'))
      } finally {
        setLoading(false)
      }
    }

    if (decodedKey) {
      fetchData()
    }
  }, [decodedKey, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Key className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('publicKey.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('publicKey.subtitle')}</p>
        </div>
      </div>

      {/* Public Key Card */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-slate-500 dark:text-slate-400">{t('publicKey.publicKey')}</span>
        </div>
        <div className="font-mono text-sm text-slate-900 dark:text-white break-all bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
          {decodedKey}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <div className="text-sm text-red-700 dark:text-red-300">
            <p className="font-medium mb-1">{t('common.error')}</p>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Related Accounts */}
      {!error && (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('publicKey.relatedAccounts')}</h2>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('common.total')} {accounts.length} {t('common.items')}
            </span>
          </div>

          {accounts.length > 0 ? (
            <div className="divide-y divide-slate-200/50 dark:divide-white/10">
              {accounts.map((account) => (
                <Link
                  key={account}
                  href={`/explorer/accounts?id=${account}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {account.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-mono text-slate-900 dark:text-white">{account}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              {t('publicKey.noAccounts')}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">{t('publicKey.info')}</p>
          <p className="text-blue-600 dark:text-blue-400">
            {t('publicKey.infoText')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PublicKeyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
      <PublicKeyContent />
    </Suspense>
  )
}
