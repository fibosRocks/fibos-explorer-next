/**
 * EOS RPC 服务
 * 封装对 FIBOS 区块链节点的 RPC 调用
 * 参考原项目: /src/app/services/eos.service.ts
 */

import { environment } from '@/lib/config/environment'
import type {
  ChainInfo,
  Account,
  Block,
  Producer,
  TableRowsResponse,
  ActionsResponse,
  TransactionResponse,
} from './types'

/**
 * 判断是否在客户端环境
 */
const isClient = typeof window !== 'undefined'

/**
 * 通用 RPC 请求函数
 * 客户端使用 /api/rpc 代理，服务端直接调用
 */
async function rpcRequest<T>(path: string, body?: unknown): Promise<T> {
  if (isClient) {
    // 客户端：通过 API 代理
    const response = await fetch('/api/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, data: body }),
    })

    if (!response.ok) {
      throw new Error(`RPC Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } else {
    // 服务端：直接调用 RPC
    const response = await fetch(`${environment.blockchainUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`RPC Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

/**
 * 获取区块链信息
 * RPC: /v1/chain/get_info
 */
export async function getInfo(): Promise<ChainInfo> {
  return rpcRequest<ChainInfo>('/v1/chain/get_info')
}

/**
 * 获取账户信息
 * RPC: /v1/chain/get_account
 */
export async function getAccount(accountName: string): Promise<Account> {
  return rpcRequest<Account>('/v1/chain/get_account', {
    account_name: accountName,
  })
}

/**
 * 获取区块信息
 * RPC: /v1/chain/get_block
 */
export async function getBlock(blockNumOrId: number | string): Promise<Block> {
  return rpcRequest<Block>('/v1/chain/get_block', {
    block_num_or_id: blockNumOrId,
  })
}

/**
 * 获取交易信息
 * RPC: /v1/history/get_transaction
 * 注意: 需要节点启用 history_plugin
 */
export async function getTransaction(id: string): Promise<TransactionResponse> {
  return rpcRequest<TransactionResponse>('/v1/history/get_transaction', { id })
}

/**
 * 获取生产者列表
 * RPC: /v1/chain/get_producers
 */
export async function getProducers(
  limit = 200,
  lowerBound = ''
): Promise<{ rows: Producer[]; total_producer_vote_weight: string; more: string }> {
  return rpcRequest('/v1/chain/get_producers', {
    json: true,
    lower_bound: lowerBound,
    limit,
  })
}

/**
 * 查询合约表数据
 * RPC: /v1/chain/get_table_rows
 */
export async function getTableRows<T = unknown>(options: {
  code: string
  scope: string
  table: string
  lower_bound?: string
  upper_bound?: string
  limit?: number
  key_type?: string
  index_position?: string
  reverse?: boolean
}): Promise<TableRowsResponse<T>> {
  return rpcRequest<TableRowsResponse<T>>('/v1/chain/get_table_rows', {
    json: true,
    ...options,
    limit: options.limit ?? 100,
  })
}

/**
 * 获取账户历史动作
 * RPC: /v1/history/get_actions
 * 注意: 需要节点启用 history_plugin 或使用自定义端点
 */
export async function getActions(
  accountName: string,
  pos = -1,
  offset = -100
): Promise<ActionsResponse> {
  return rpcRequest<ActionsResponse>('/v1/history/get_actions', {
    account_name: accountName,
    pos,
    offset,
  })
}

/**
 * 获取公钥关联的账户
 * RPC: /v1/history/get_key_accounts
 * 注意: 需要节点启用 history_plugin
 */
export async function getKeyAccounts(publicKey: string): Promise<{ account_names: string[] }> {
  return rpcRequest<{ account_names: string[] }>('/v1/history/get_key_accounts', {
    public_key: publicKey,
  })
}

/**
 * 获取代币余额
 * RPC: /v1/chain/get_currency_balance
 */
export async function getCurrencyBalance(
  code: string,
  account: string,
  symbol?: string
): Promise<string[]> {
  return rpcRequest<string[]>('/v1/chain/get_currency_balance', {
    code,
    account,
    symbol,
  })
}

/**
 * 获取 ABI
 * RPC: /v1/chain/get_abi
 */
export async function getAbi(accountName: string): Promise<{ account_name: string; abi: unknown }> {
  return rpcRequest('/v1/chain/get_abi', {
    account_name: accountName,
  })
}

// ==================== 便捷方法 ====================

/**
 * 获取账户 FO 余额 (FIBOS 特定)
 * 使用 getTableRows 查询 eosio.token accounts 表
 */
export async function getAccountBalances(accountName: string) {
  const result = await getTableRows<{ balance: { quantity: string; contract: string } }>({
    code: environment.tokenContract,
    scope: accountName,
    table: 'accounts',
    limit: 100,
  })
  return result.rows
}

/**
 * 获取账户锁仓余额 (FIBOS 特定)
 */
export async function getLockedBalances(accountName: string) {
  const result = await getTableRows<{
    balance: { quantity: string; contract: string }
    lock_timestamp: number
  }>({
    code: environment.tokenContract,
    scope: accountName,
    table: 'lockaccounts',
    limit: 100,
  })
  return result.rows
}

/**
 * 获取全局投票状态
 */
export async function getGlobalState() {
  const result = await getTableRows<{
    total_producer_vote_weight: string
    total_activated_stake: string
    total_ram_bytes_reserved: string
    max_ram_size: string
  }>({
    code: environment.systemContract,
    scope: environment.systemContract,
    table: 'global',
    limit: 1,
  })
  return result.rows[0]
}

/**
 * 获取生产者 JSON 信息
 */
export async function getProducerJson(producerName?: string) {
  const result = await getTableRows<{ owner: string; json: string }>({
    code: 'producerjson',
    scope: 'producerjson',
    table: 'producerjson',
    lower_bound: producerName,
    limit: producerName ? 1 : 100,
  })
  return result.rows
}
