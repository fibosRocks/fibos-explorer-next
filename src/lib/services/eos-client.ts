/**
 * EOS RPC 服务 - 客户端版本
 * 通过 /api/rpc 代理调用，解决 CORS 问题
 * 用于客户端组件 ('use client')
 */

import type {
  ChainInfo,
  Producer,
  ActionsResponse,
  ProducerVoter,
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
 */
export async function getInfo(): Promise<ChainInfo> {
  return rpcRequest<ChainInfo>('/v1/chain/get_info')
}

/**
 * 获取生产者列表
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

// ==================== 外部 API ====================

import type { BpStatusResponse } from './types'

/**
 * 获取 BP 节点状态 (通过代理)
 */
export async function getBpStatus(): Promise<BpStatusResponse> {
  const response = await fetch('/api/external/bp-status')

  if (!response.ok) {
    throw new Error(`BP Status API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * 获取节点总票数
 */
export async function getProducerVotes(producer: string): Promise<number> {
  const response = await fetch(`/api/explorer?path=/vote&producer=${producer}`)
  if (!response.ok) return 0
  const data = await response.json()
  // data might be { data: "123" } if route.ts parsed text, or just number
  if (typeof data === 'number') return data
  if (data && typeof data.data === 'string') return parseFloat(data.data) || 0
  return 0
}

/**
 * 获取节点的投票者列表
 */
export async function getProducerVoters(producer: string, page = 0): Promise<ProducerVoter[]> {
  const response = await fetch(`/api/explorer?path=/voter&producer=${producer}&page=${page}`)
  if (!response.ok) return []
  const data = await response.json()
  return Array.isArray(data) ? data : []
}
