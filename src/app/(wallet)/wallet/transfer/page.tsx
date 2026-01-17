'use client'

import { useState, useEffect } from 'react'
import { Send, Wallet, ChevronDown, Info, Loader2 } from 'lucide-react'
import { useWalletStore } from '@/stores/walletStore'
import { TransactionSuccess } from '@/components/features/TransactionSuccess'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

export default function TransferPage() {
  const { t } = useTranslation()
  const { connected, account, accountStatus, balances, connect, connecting, transact, getPermission } = useWalletStore()

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [selectedToken, setSelectedToken] = useState('FO')
  const [showTokenMenu, setShowTokenMenu] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; txId?: string } | null>(null)

  // 获取可用代币列表
  const tokens = balances.length > 0
    ? balances.map(b => {
        const parts = b.quantity.split(' ')
        return { symbol: parts[1] || 'UNKNOWN', amount: parts[0] || '0', contract: b.contract }
      })
    : [{ symbol: 'FO', amount: '0.0000', contract: 'eosio' }]

  // 当前选中代币的余额
  const currentToken = tokens.find(t => t.symbol === selectedToken) || tokens[0]
  const availableBalance = currentToken?.amount || '0.0000'

  // 设置全部金额
  const setMaxAmount = () => {
    setAmount(availableBalance)
  }

  // 验证账户名
  const isValidAccountName = (name: string) => {
    return /^[a-z1-5.]{1,12}$/.test(name)
  }

  // 发送转账
  const handleTransfer = async () => {
    if (!connected || !account) {
      setError(t('transfer.errorConnectFirst'))
      return
    }

    if (!to || !isValidAccountName(to)) {
      setError(t('transfer.errorInvalidAccount'))
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(t('transfer.errorInvalidAmount'))
      return
    }

    if (amountNum > parseFloat(availableBalance)) {
      setError(t('transfer.errorInsufficientBalance'))
      return
    }

    const permission = getPermission()
    if (!permission) {
      setError(t('transfer.errorNoPermission'))
      return
    }

    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      // 格式化金额为 4 位小数
      const quantity = `${amountNum.toFixed(4)} ${selectedToken}`

      const result = await transact([{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [permission],
        data: {
          from: account.name,
          to,
          quantity,
          memo,
        },
      }])

      setSuccess({
        message: t('success.transfer'),
        txId: result.transaction_id
      })
      setTo('')
      setAmount('')
      setMemo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('transfer.errorTransferFailed'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('transfer.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('transfer.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
            {/* From Account */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('transfer.fromAccount')}
              </label>
              <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  {connected && account ? (
                    <>
                      <div className="font-mono text-slate-900 dark:text-white">{account.name}</div>
                      <div className="text-xs text-slate-400">{accountStatus?.balance || '0 FO'}</div>
                    </>
                  ) : (
                    <button
                      onClick={() => connect()}
                      disabled={connecting}
                      className="text-purple-600 dark:text-cyan-400 text-sm hover:underline"
                    >
                      {connecting ? t('common.connecting') : t('transfer.clickToConnect')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* To Account */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('transfer.recipient')}
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value.toLowerCase())}
                placeholder={t('transfer.recipientHint')}
                className="w-full h-12 md:h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-2">{t('transfer.accountNameRule')}</p>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('transfer.transferAmount')}
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0000"
                    className="w-full h-12 md:h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  />
                  <button
                    onClick={setMaxAmount}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-600 dark:text-cyan-400 font-medium hover:underline"
                  >
                    {t('transfer.max')}
                  </button>
                </div>
                {/* Token Select */}
                <div className="relative">
                  <button
                    onClick={() => setShowTokenMenu(!showTokenMenu)}
                    className="h-12 md:h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{selectedToken}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  {showTokenMenu && tokens.length > 1 && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTokenMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[120px]">
                        {tokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setSelectedToken(token.symbol)
                              setShowTokenMenu(false)
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                              selectedToken === token.symbol
                                ? 'bg-purple-500/10 text-purple-600 dark:text-cyan-400'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            )}
                          >
                            <span>{token.symbol}</span>
                            <span className="text-xs text-slate-400">{token.amount}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>{t('transfer.availableBalance')}</span>
                <span>{availableBalance} {selectedToken}</span>
              </div>
            </div>

            {/* Memo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('transfer.memo')} <span className="text-slate-400 font-normal">{t('transfer.memoOptional')}</span>
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder={t('transfer.memoHint')}
                className="w-full h-12 md:h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Error/Success Message */}
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
              onClick={handleTransfer}
              disabled={!connected || sending}
              className={cn(
                'w-full h-12 md:h-11 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                connected
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('transfer.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('transfer.confirmTransfer')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Balance Info */}
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">{t('transfer.availableBalance')}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {connected ? (accountStatus?.balance || '0 FO') : '0 FO'}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <p className="mb-2">{t('transfer.transferInfo')}</p>
                <ul className="text-slate-400 space-y-1">
                  <li>• {t('transfer.transferRule1')}</li>
                  <li>• {t('transfer.transferRule2')}</li>
                  <li>• {t('transfer.transferRule3')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
