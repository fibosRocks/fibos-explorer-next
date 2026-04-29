/**
 * Explorer API 服务 - 客户端版本
 * 通过 /api/explorer 和 /api/external 代理调用
 * 用于客户端组件 ('use client')
 *
 * 注意：此文件用于调用后端 Explorer API 和外部 API
 * EOS 节点 RPC 调用请使用 eos-client.ts
 */

import type { ProducerHealth, ProducerVoter, AccountTrace, ProxiedAccount, AccountHistoryResponse } from './types'

// ==================== Explorer API ====================

/**
 * 通过代理调用 Explorer API
 */
async function explorerRequest<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const searchParams = new URLSearchParams({ path })

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(`/api/explorer?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error(`Explorer API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * 获取节点总票数
 * API: /vote?producer=xxx
 */
export async function getProducerVotes(producer: string): Promise<number> {
  try {
    const data = await explorerRequest<unknown>('/vote', { producer })
    if (typeof data === 'number') return data
    if (data && typeof (data as { data?: string }).data === 'string') {
      return parseFloat((data as { data: string }).data) || 0
    }
    return 0
  } catch {
    return 0
  }
}

/**
 * 获取节点的投票者列表
 * API: /voter?producer=xxx&page=x
 */
export async function getProducerVoters(producer: string, page = 0): Promise<ProducerVoter[]> {
  try {
    const data = await explorerRequest<unknown>('/voter', { producer, page })
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * 获取账户交易历史
 * API: /accountTraces?name=xxx&page=x
 */
export async function getAccountTraces(name: string, page = 1): Promise<AccountTrace[]> {
  try {
    const data = await explorerRequest<unknown>('/accountTraces', { name, page })
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * 获取被代理人列表
 * API: /proxy?proxy=xxx&page=x
 */
export async function getProxiedAccounts(proxy: string, page = 0): Promise<ProxiedAccount[]> {
  try {
    const data = await explorerRequest<unknown>('/proxy', { proxy, page })
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * 获取代理的被代理票数
 * API: /proxies 返回所有代理列表，找到指定代理的 proxied_vote
 */
export async function getProxiedVote(proxyName: string): Promise<number> {
  try {
    const data = await explorerRequest<{ proxy: string; proxied_vote: number }[]>('/proxies')
    if (!Array.isArray(data)) return 0
    const found = data.find(p => p.proxy === proxyName)
    return found?.proxied_vote || 0
  } catch {
    return 0
  }
}

/**
 * 获取账户交易历史（cursor 分页）
 * 路由：/api/explorer-history/:account → tracker /explorer/history/:account
 */
export async function getAccountHistory(
  account: string,
  cursor: number | null,
  limit = 50,
): Promise<AccountHistoryResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor != null) params.set('cursor', String(cursor))
  const res = await fetch(`/api/explorer-history/${account}?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `AccountHistory ${res.status}`)
  }
  return res.json()
}

/**
 * 获取节点健康状态
 * API: /producerHealth
 */
export async function getProducerHealth(): Promise<ProducerHealth[]> {
  try {
    const data = await explorerRequest<unknown>('/producerHealth')
    return Array.isArray(data) ? (data as ProducerHealth[]) : []
  } catch {
    return []
  }
}
