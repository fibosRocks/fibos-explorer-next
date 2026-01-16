/**
 * 钱包状态管理
 * 使用 Zustand 管理钱包连接状态
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account } from '@/lib/services/types'
import * as eos from '@/lib/services/eos'

interface WalletState {
  // 连接状态
  connected: boolean
  connecting: boolean

  // 账户信息
  accountName: string | null
  accountInfo: Account | null

  // 代币余额
  balances: { quantity: string; contract: string }[]

  // 操作方法
  connect: () => Promise<void>
  disconnect: () => void
  refreshAccountInfo: () => Promise<void>
  setAccountName: (name: string) => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // 初始状态
      connected: false,
      connecting: false,
      accountName: null,
      accountInfo: null,
      balances: [],

      // 连接钱包
      connect: async () => {
        set({ connecting: true })

        try {
          // TODO: 实现实际的钱包连接逻辑 (Scatter/Anchor/TokenPocket 等)
          // 目前使用模拟连接

          // 检查是否有 Scatter 或其他钱包插件
          // const scatter = (window as any).scatter
          // if (scatter) {
          //   await scatter.connect('FIBOS ROCKS')
          //   const identity = await scatter.getIdentity({ accounts: [{ chainId, blockchain: 'eos' }] })
          //   const account = identity.accounts[0]
          //   set({ accountName: account.name, connected: true })
          // }

          // 模拟：暂时不实际连接，只设置状态
          console.log('钱包连接功能待实现')
          set({ connecting: false })
        } catch (error) {
          console.error('钱包连接失败:', error)
          set({ connecting: false })
        }
      },

      // 断开连接
      disconnect: () => {
        set({
          connected: false,
          accountName: null,
          accountInfo: null,
          balances: [],
        })
      },

      // 刷新账户信息
      refreshAccountInfo: async () => {
        const { accountName, connected } = get()

        if (!connected || !accountName) {
          return
        }

        try {
          // 获取账户信息
          const accountInfo = await eos.getAccount(accountName)
          set({ accountInfo })

          // 获取代币余额
          const balanceRows = await eos.getAccountBalances(accountName)
          const balances = balanceRows.map((row) => ({
            quantity: row.balance.quantity,
            contract: row.balance.contract,
          }))
          set({ balances })
        } catch (error) {
          console.error('获取账户信息失败:', error)
        }
      },

      // 设置账户名（用于开发测试）
      setAccountName: (name: string) => {
        set({ accountName: name, connected: true })
        // 自动刷新账户信息
        get().refreshAccountInfo()
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        // 只持久化账户名，不持久化连接状态
        accountName: state.accountName,
      }),
    }
  )
)
