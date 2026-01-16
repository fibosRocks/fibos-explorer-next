/**
 * 钱包状态管理
 * 使用 Zustand 管理钱包连接状态
 * 参考原项目: /src/app/services/ironman.service.ts
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account } from '@/lib/services/types'
import { environment, networkConfig } from '@/lib/config/environment'

// ==================== 类型定义 ====================

/**
 * 钱包插件类型
 */
export type WalletType = 'ironman' | 'scatter' | 'mathwallet' | 'tokenpocket' | null

/**
 * 钱包账户信息
 */
export interface WalletAccount {
  name: string
  authority: string // 'active' | 'owner'
}

/**
 * 资源信息
 */
export interface ResourceInfo {
  used: number
  max: number
  available: number
}

/**
 * 账户状态信息
 */
export interface AccountStatus {
  ram: ResourceInfo
  cpu: ResourceInfo
  net: ResourceInfo
  staked: number
  balance: string
  refunding: number
}

/**
 * 交易 Action
 */
export interface TransactionAction {
  account: string
  name: string
  authorization: { actor: string; permission: string }[]
  data: Record<string, unknown>
}

/**
 * 钱包状态
 */
interface WalletState {
  // 连接状态
  connected: boolean
  connecting: boolean
  walletType: WalletType

  // 账户信息
  account: WalletAccount | null
  accountInfo: Account | null
  accountStatus: AccountStatus | null

  // 代币余额
  balances: { quantity: string; contract: string }[]

  // 错误信息
  error: string | null

  // 操作方法
  checkWallet: () => WalletType
  connect: () => Promise<boolean>
  disconnect: () => void
  refreshAccountInfo: () => Promise<void>

  // 交易方法
  getPermission: () => { actor: string; permission: string } | null
  transact: (actions: TransactionAction[]) => Promise<{ transaction_id: string }>
}

// ==================== 全局类型声明 ====================

declare global {
  interface Window {
    ironman?: IronmanWallet
    eosiowallet?: IronmanWallet
    scatter?: ScatterWallet
  }
}

interface IronmanWallet {
  getIdentity: (options: { accounts: NetworkConfig[] }) => Promise<{ accounts: WalletAccount[] }>
  forgetIdentity: () => Promise<void>
  fibos: (network: NetworkConfig, eosjs: unknown, options?: unknown) => FibosInterface
  eos?: (network: NetworkConfig, eosjs: unknown, options?: unknown) => FibosInterface
}

interface ScatterWallet {
  connect: (appName: string) => Promise<boolean>
  login: () => Promise<{ accounts: WalletAccount[] }>
  logout: () => Promise<void>
  eos: (network: NetworkConfig, eosjs: unknown, options?: unknown) => FibosInterface
}

interface NetworkConfig {
  blockchain: string
  chainId: string
  host: string
  port: number
  protocol: string
}

interface FibosInterface {
  transaction: (tx: { actions: TransactionAction[] }) => Promise<{ transaction_id: string }>
  getAccount: (name: string) => Promise<Account>
  getTableRows: (options: {
    code: string
    scope: string
    table: string
    json?: boolean
    limit?: number
  }) => Promise<{ rows: unknown[] }>
}

// ==================== 辅助函数 ====================

/**
 * 解析余额字符串
 */
function parseBalance(balance?: string): number {
  if (!balance) return 0
  return parseFloat(balance.split(' ')[0]) || 0
}

/**
 * 获取钱包插件实例
 */
function getWalletInstance(): IronmanWallet | null {
  if (typeof window === 'undefined') return null

  // 优先使用 ironman
  if (window.ironman) {
    // 统一接口
    if (!window.eosiowallet) {
      window.eosiowallet = window.ironman
    }
    return window.ironman
  }

  // 其次使用 eosiowallet (MathWallet 等)
  if (window.eosiowallet) {
    return window.eosiowallet
  }

  return null
}

// ==================== Store 实现 ====================

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // 初始状态
      connected: false,
      connecting: false,
      walletType: null,
      account: null,
      accountInfo: null,
      accountStatus: null,
      balances: [],
      error: null,

      /**
       * 检测钱包插件
       */
      checkWallet: () => {
        if (typeof window === 'undefined') return null

        // 检测移动端钱包
        const ua = navigator.userAgent
        if (ua.includes('MathWallet')) {
          return 'mathwallet'
        }
        if (ua.includes('TokenPocket')) {
          return 'tokenpocket'
        }

        // 检测桌面端插件
        if (window.ironman) {
          return 'ironman'
        }
        if (window.eosiowallet) {
          return 'mathwallet'
        }
        if (window.scatter) {
          return 'scatter'
        }

        return null
      },

      /**
       * 连接钱包
       */
      connect: async () => {
        const { checkWallet } = get()
        set({ connecting: true, error: null })

        try {
          const walletType = checkWallet()

          if (!walletType) {
            // 未安装插件时静默失败，不显示错误
            set({ connecting: false })
            return false
          }

          const wallet = getWalletInstance()
          if (!wallet) {
            set({ error: '钱包插件初始化失败', connecting: false })
            return false
          }

          // 请求授权
          const identity = await wallet.getIdentity({
            accounts: [networkConfig],
          })

          if (!identity || !identity.accounts || identity.accounts.length === 0) {
            set({ error: '未获取到账户信息', connecting: false })
            return false
          }

          const account = identity.accounts[0]

          set({
            connected: true,
            connecting: false,
            walletType,
            account: {
              name: account.name,
              authority: account.authority || 'active',
            },
          })

          // 获取账户详细信息
          await get().refreshAccountInfo()

          return true
        } catch (error) {
          const message = error instanceof Error ? error.message : '连接失败'
          console.error('钱包连接失败:', error)
          set({ error: message, connecting: false })
          return false
        }
      },

      /**
       * 断开连接
       */
      disconnect: () => {
        const wallet = getWalletInstance()
        if (wallet) {
          wallet.forgetIdentity().catch(console.error)
        }

        set({
          connected: false,
          walletType: null,
          account: null,
          accountInfo: null,
          accountStatus: null,
          balances: [],
          error: null,
        })
      },

      /**
       * 刷新账户信息
       */
      refreshAccountInfo: async () => {
        const { account, connected } = get()

        if (!connected || !account) {
          return
        }

        try {
          // 通过 API 代理获取账户信息
          const response = await fetch('/api/rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: '/v1/chain/get_account',
              data: { account_name: account.name },
            }),
          })

          if (!response.ok) throw new Error('获取账户信息失败')
          const accountInfo: Account = await response.json()

          // 获取代币余额
          const balanceResponse = await fetch('/api/rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: '/v1/chain/get_table_rows',
              data: {
                json: true,
                code: environment.tokenContract,
                scope: account.name,
                table: 'accounts',
                limit: 100,
              },
            }),
          })

          let balances: { quantity: string; contract: string }[] = []
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json()
            balances = (balanceData.rows || []).map((row: { balance: { quantity: string; contract: string } }) => ({
              quantity: row.balance.quantity,
              contract: row.balance.contract,
            }))
          }

          // 计算账户状态
          const staked = (accountInfo.voter_info?.staked || 0) / 10000
          const refundCpu = parseBalance(accountInfo.refund_request?.cpu_amount)
          const refundNet = parseBalance(accountInfo.refund_request?.net_amount)

          // 获取 FO 余额
          const foBalance = balances.find((b) => b.quantity.endsWith('FO'))
          const liquidBalance = foBalance ? foBalance.quantity : (accountInfo.core_liquid_balance || '0 FO')

          const accountStatus: AccountStatus = {
            ram: {
              used: accountInfo.ram_usage,
              max: accountInfo.ram_quota,
              available: accountInfo.ram_quota - accountInfo.ram_usage,
            },
            cpu: {
              used: accountInfo.cpu_limit.used,
              max: accountInfo.cpu_limit.max,
              available: accountInfo.cpu_limit.available,
            },
            net: {
              used: accountInfo.net_limit.used,
              max: accountInfo.net_limit.max,
              available: accountInfo.net_limit.available,
            },
            staked,
            balance: liquidBalance,
            refunding: refundCpu + refundNet,
          }

          set({ accountInfo, accountStatus, balances })
        } catch (error) {
          console.error('获取账户信息失败:', error)
        }
      },

      /**
       * 获取当前账户权限（用于交易授权）
       */
      getPermission: () => {
        const { account, connected } = get()
        if (!connected || !account) return null

        return {
          actor: account.name,
          permission: account.authority,
        }
      },

      /**
       * 发送交易
       */
      transact: async (actions: TransactionAction[]) => {
        const { connected, account, walletType } = get()

        if (!connected || !account) {
          throw new Error('钱包未连接')
        }

        const wallet = getWalletInstance()
        if (!wallet) {
          throw new Error('钱包插件不可用')
        }

        // 获取签名接口
        // 注意：这里需要动态导入 eosjs，避免 SSR 问题
        // 实际使用时，钱包插件会提供签名功能
        let fibos: FibosInterface

        if (walletType === 'scatter' && window.scatter) {
          // Scatter 使用其自己的 eos 接口
          fibos = window.scatter.eos(networkConfig, null as unknown, { expireInSeconds: 60 })
        } else if (wallet.fibos) {
          // FIBOS 插件
          fibos = wallet.fibos(networkConfig, null as unknown, { expireInSeconds: 60 })
        } else if (wallet.eos) {
          // 其他 EOS 兼容钱包
          fibos = wallet.eos(networkConfig, null as unknown, { expireInSeconds: 60 })
        } else {
          throw new Error('钱包不支持交易签名')
        }

        // 发送交易
        const result = await fibos.transaction({ actions })

        // 刷新账户信息
        setTimeout(() => get().refreshAccountInfo(), 1000)

        return result
      },
    }),
    {
      name: 'fibos-wallet',
      partialize: (state) => ({
        // 只持久化账户信息，不持久化连接状态
        account: state.account,
      }),
    }
  )
)
