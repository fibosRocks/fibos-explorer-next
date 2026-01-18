'use client'

import { useState } from 'react'
import { UserPlus, Key, CheckCircle, AlertCircle, Info, Wallet, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWalletStore } from '@/stores/walletStore'
import { TransactionSuccess } from '@/components/features/TransactionSuccess'
import { useTranslation } from '@/lib/i18n'
import { environment } from '@/lib/config/environment'

/**
 * 创建账户页面
 *
 * 数据来源 (参考老项目 tools/create/create.component.ts):
 * - 账户名验证: 正则 /^([a-z1-5]){12}$/
 * - 公钥验证: ecc.isValidPublic(key, 'FO') - FIBOS 公钥前缀为 FO
 * - 默认资源: RAM=4096 bytes, CPU=0.1 FO, NET=0.1 FO
 *
 * 创建操作:
 * - ironman.scatter.getIdentity() -> 获取创建者账户
 * - eosService.eos.transaction() -> newaccount + buyrambytes + delegatebw
 *
 * 重要: 不在前端生成密钥，只接受用户输入的公钥
 */

export default function CreateAccountPage() {
  const { t } = useTranslation()
  const { connected, account, connect, transact, getPermission } = useWalletStore()

  const [accountName, setAccountName] = useState('')
  const [ownerKey, setOwnerKey] = useState('')
  const [activeKey, setActiveKey] = useState('')
  const [ramBytes, setRamBytes] = useState('4096')
  const [cpuAmount, setCpuAmount] = useState('0.1000')
  const [netAmount, setNetAmount] = useState('0.1000')

  const [isValidName, setIsValidName] = useState<boolean | null>(null)
  const [isValidOwnerKey, setIsValidOwnerKey] = useState<boolean | null>(null)
  const [isValidActiveKey, setIsValidActiveKey] = useState<boolean | null>(null)

  const [checkingName, setCheckingName] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; txId?: string } | null>(null)

  // 账户名验证: 12位小写字母(a-z)和数字(1-5)
  const validateAccountName = (name: string) => {
    const regex = /^[a-z1-5]{12}$/
    return regex.test(name)
  }

  // 检查账户是否存在
  const checkAccountAvailability = async (name: string) => {
    if (!validateAccountName(name)) return

    setCheckingName(true)
    setNameAvailable(null)

    try {
      const response = await fetch(`${environment.blockchainUrl}/v1/chain/get_account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_name: name }),
      })

      // 如果获取到了账户信息，说明账户已存在（不可用）
      if (response.ok) {
        setNameAvailable(false)
      } else {
        // 如果报错（通常是 500 unknown key），说明账户不存在（可用）
        setNameAvailable(true)
      }
    } catch (e) {
      console.error('Check account error:', e)
    } finally {
      setCheckingName(false)
    }
  }

  // 随机生成账户名
  const generateRandomName = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz12345'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setAccountName(result)
    setIsValidName(true)
    checkAccountAvailability(result)
  }

  // 公钥验证: FIBOS 公钥以 FO 开头，长度约 53 字符
  // 实际验证应使用 ecc.isValidPublic(key, 'FO')
  const validatePublicKey = (key: string) => {
    // 简化验证: 以 FO 开头且长度合理
    return key.startsWith('FO') && key.length >= 50 && key.length <= 60
  }

  const handleNameChange = (value: string) => {
    const lowered = value.toLowerCase()
    setAccountName(lowered)
    setNameAvailable(null) // 重置可用性状态
    if (lowered.length === 0) {
      setIsValidName(null)
    } else if (lowered.length === 12) {
      const valid = validateAccountName(lowered)
      setIsValidName(valid)
      if (valid) {
        // 如果输入完整且格式正确，自动检查可用性
        checkAccountAvailability(lowered)
      }
    } else {
      setIsValidName(false)
    }
  }

  const handleOwnerKeyChange = (value: string) => {
    setOwnerKey(value)
    if (value.length === 0) {
      setIsValidOwnerKey(null)
    } else {
      setIsValidOwnerKey(validatePublicKey(value))
    }
  }

  const handleActiveKeyChange = (value: string) => {
    setActiveKey(value)
    if (value.length === 0) {
      setIsValidActiveKey(null)
    } else {
      setIsValidActiveKey(validatePublicKey(value))
    }
  }

  const handleCreateAccount = async () => {
    if (!connected || !account) {
        connect()
        return
    }

    const permission = getPermission()
    if (!permission) {
        setError(t('createAccount.errorNoPermission'))
        return
    }

    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
        const result = await transact([
            {
              account: 'eosio',
              name: 'newaccount',
              authorization: [permission],
              data: {
                creator: account.name,
                name: accountName,
                owner: {
                  threshold: 1,
                  keys: [{ key: ownerKey, weight: 1 }],
                  accounts: [],
                  waits: []
                },
                active: {
                  threshold: 1,
                  keys: [{ key: activeKey, weight: 1 }],
                  accounts: [],
                  waits: []
                },
              },
            },
            {
              account: 'eosio',
              name: 'buyrambytes',
              authorization: [permission],
              data: {
                payer: account.name,
                receiver: accountName,
                bytes: parseInt(ramBytes),
              },
            },
            {
              account: 'eosio',
              name: 'delegatebw',
              authorization: [permission],
              data: {
                from: account.name,
                receiver: accountName,
                stake_net_quantity: `${parseFloat(netAmount).toFixed(4)} FO`,
                stake_cpu_quantity: `${parseFloat(cpuAmount).toFixed(4)} FO`,
                transfer: 1,
              },
            },
        ])

        setSuccess({
            message: t('createAccount.successMessage').replace('{name}', accountName),
            txId: result.transaction_id
        })
        setAccountName('')
        setOwnerKey('')
        setActiveKey('')
        setIsValidName(null)
        setIsValidOwnerKey(null)
        setIsValidActiveKey(null)

    } catch (err) {
        setError(err instanceof Error ? err.message : t('createAccount.errorFailed'))
    } finally {
        setCreating(false)
    }
  }

  const isFormValid = isValidName && isValidOwnerKey && isValidActiveKey && connected

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('createAccount.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('createAccount.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Creator Account - 来自 ironman.getIdentity() */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('createAccount.creatorAccount')}</h2>
            <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                {connected && account ? (
                    <div className="text-slate-900 dark:text-white font-mono">{account.name}</div>
                ) : (
                    <button onClick={() => connect()} className="text-purple-600 text-sm hover:underline">
                        {t('createAccount.clickToConnect')}
                    </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{t('createAccount.creatorCost')}</p>
          </div>

          {/* Account Name */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('createAccount.newAccountInfo')}</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('createAccount.accountName')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('createAccount.accountPlaceholder')}
                  maxLength={12}
                  className={cn(
                    'w-full h-12 px-4 pr-32 bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
                    isValidName === true && 'border-emerald-500 focus:ring-emerald-500/50',
                    isValidName === false && 'border-red-500 focus:ring-red-500/50',
                    isValidName === null && 'border-slate-200 dark:border-slate-700 focus:ring-purple-500/50 focus:border-purple-500'
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {checkingName && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  <button
                    onClick={generateRandomName}
                    className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t('createAccount.random')}
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className={cn(
                  isValidName === false || nameAvailable === false ? 'text-red-500' :
                  nameAvailable === true ? 'text-emerald-500' : 'text-slate-400'
                )}>
                  {isValidName === false
                    ? t('createAccount.invalidNameFormat')
                    : nameAvailable === false
                    ? t('createAccount.nameTaken')
                    : nameAvailable === true
                    ? t('createAccount.nameAvailable')
                    : t('createAccount.nameHint')}
                </span>
                <span className="text-slate-400">{accountName.length}/12</span>
              </div>
            </div>
          </div>

          {/* Public Keys - 用户输入，不生成 */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('createAccount.keySettings')}</h2>

            {/* Owner Public Key */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-amber-500" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('createAccount.ownerKey')}</label>
                <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{t('createAccount.ownerPermission')}</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={ownerKey}
                  onChange={(e) => handleOwnerKeyChange(e.target.value)}
                  placeholder={t('createAccount.keyPlaceholder')}
                  className={cn(
                    'w-full h-12 px-4 pr-12 bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all font-mono text-sm',
                    isValidOwnerKey === true && 'border-emerald-500 focus:ring-emerald-500/50',
                    isValidOwnerKey === false && 'border-red-500 focus:ring-red-500/50',
                    isValidOwnerKey === null && 'border-slate-200 dark:border-slate-700 focus:ring-purple-500/50 focus:border-purple-500'
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidOwnerKey === true && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {isValidOwnerKey === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {isValidOwnerKey === false && (
                <p className="text-xs text-red-500 mt-2">{t('createAccount.invalidKey')}</p>
              )}
            </div>

            {/* Active Public Key */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-cyan-500" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('createAccount.activeKey')}</label>
                <span className="text-xs text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">{t('createAccount.activePermission')}</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={activeKey}
                  onChange={(e) => handleActiveKeyChange(e.target.value)}
                  placeholder={t('createAccount.keyPlaceholder')}
                  className={cn(
                    'w-full h-12 px-4 pr-12 bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all font-mono text-sm',
                    isValidActiveKey === true && 'border-emerald-500 focus:ring-emerald-500/50',
                    isValidActiveKey === false && 'border-red-500 focus:ring-red-500/50',
                    isValidActiveKey === null && 'border-slate-200 dark:border-slate-700 focus:ring-purple-500/50 focus:border-purple-500'
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidActiveKey === true && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {isValidActiveKey === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {isValidActiveKey === false && (
                <p className="text-xs text-red-500 mt-2">{t('createAccount.invalidKey')}</p>
              )}
            </div>
          </div>

          {/* Initial Resources - 默认值来自老项目 */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('createAccount.initialResources')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* RAM - 默认 4096 bytes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('createAccount.ramBytes')}
                </label>
                <input
                  type="text"
                  value={ramBytes}
                  onChange={(e) => setRamBytes(e.target.value)}
                  placeholder="4096"
                  className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>

              {/* CPU - 默认 0.1 FO */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('createAccount.cpuStake')}
                </label>
                <input
                  type="text"
                  value={cpuAmount}
                  onChange={(e) => setCpuAmount(e.target.value)}
                  placeholder="0.1000"
                  className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>

              {/* NET - 默认 0.1 FO */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('createAccount.netStake')}
                </label>
                <input
                  type="text"
                  value={netAmount}
                  onChange={(e) => setNetAmount(e.target.value)}
                  placeholder="0.1000"
                  className="w-full h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t('createAccount.estimatedCost')}: <span className="font-medium text-slate-900 dark:text-white">~{(parseFloat(cpuAmount) + parseFloat(netAmount) + 0.05).toFixed(4)} FO</span>
              <span className="text-xs text-slate-400 ml-2">{t('createAccount.costNote')}</span>
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

          {/* Create Button */}
          <button
            onClick={handleCreateAccount}
            disabled={!isFormValid || creating}
            className={cn(
              'w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
              isFormValid && !creating
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            )}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {creating ? t('createAccount.creating') : t('createAccount.create')}
          </button>
        </div>

        {/* Right Side - Info */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{t('createAccount.howToGetKey')}</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('createAccount.keyToolLink')}:
                  <a
                    href="https://eosio-key.github.io/eos-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 underline font-mono hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    https://eosio-key.github.io/eos-key
                  </a>
                </p>
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t('createAccount.securityWarning')}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 leading-relaxed">
                    {t('createAccount.securityWarningText1')}
                    <br />
                    • <strong>{t('createAccount.securityWarningText2')}</strong>
                    <br />
                    • <strong>{t('createAccount.securityWarningText3')}</strong>
                    <br />
                    {t('createAccount.securityWarningText4')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Name Rules */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">{t('createAccount.rules')}</span>
            </div>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {t('createAccount.rule1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {t('createAccount.rule2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {t('createAccount.rule3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {t('createAccount.rule4')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {t('createAccount.rule5')}
              </li>
            </ul>
          </div>

          {/* Key Info */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">{t('createAccount.keyInfo')}</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
              <div>
                <span className="font-medium text-amber-500">{t('createAccount.ownerKey')}</span>
                <p className="text-slate-400 mt-1">{t('createAccount.ownerKeyDesc')}</p>
              </div>
              <div>
                <span className="font-medium text-cyan-500">{t('createAccount.activeKey')}</span>
                <p className="text-slate-400 mt-1">{t('createAccount.activeKeyDesc')}</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">{t('createAccount.warning')}</h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• {t('createAccount.warningText1')}</li>
                  <li>• {t('createAccount.warningText2')}</li>
                  <li>• {t('createAccount.warningText3')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
