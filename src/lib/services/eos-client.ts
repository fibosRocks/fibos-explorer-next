/**
 * EOS RPC 服务 - 客户端版本
 * 通过 /api/rpc 代理调用，解决 CORS 问题
 * 用于客户端组件 ('use client')
 *
 * 注意：此文件只包含 EOS 节点 RPC 调用
 * 后端 API 调用请使用 api-client.ts
 */

import type {
  ChainInfo,
  Producer,
  ActionsResponse,
} from './types'

/**
 * 通过 API 代理发送 RPC 请求
 */
async function rpcRequest<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, data }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `RPC Error: ${response.status}`)
  }

  return response.json()
}

/**
 * 获取账户操作历史
 * RPC: /v1/history/get_actions
 */
export async function getActions(
  accountName: string,
  pos: number,
  offset: number
): Promise<ActionsResponse> {
  return rpcRequest('/v1/history/get_actions', {
    account_name: accountName,
    pos,
    offset,
  })
}

/**
 * 获取区块链信息
 * RPC: /v1/chain/get_info
 */
export async function getInfo(): Promise<ChainInfo> {
  return rpcRequest<ChainInfo>('/v1/chain/get_info')
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
}): Promise<{ rows: T[]; more: boolean; next_key?: string }> {
  return rpcRequest('/v1/chain/get_table_rows', {
    json: true,
    ...options,
    limit: options.limit ?? 100,
  })
}

/**
 * 获取全局投票状态
 * 使用 getTableRows 查询 eosio global 表
 */
export async function getGlobalState() {
  const result = await getTableRows<{
    total_producer_vote_weight: string
    total_activated_stake: string
    total_ram_bytes_reserved: string
    max_ram_size: string
  }>({
    code: 'eosio',
    scope: 'eosio',
    table: 'global',
    limit: 1,
  })
  return result.rows[0]
}
