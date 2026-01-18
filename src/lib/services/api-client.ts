/**
 * Explorer API 服务 - 客户端版本
 * 直接调用后端 API（后端已支持 CORS）
 * 用于客户端组件 ('use client')
 *
 * 注意：此文件用于调用后端 Explorer API 和外部 API
 * EOS 节点 RPC 调用请使用 eos-client.ts
 */

import { environment } from '@/lib/config/environment'
import type { BpStatusResponse, ProducerVoter, AccountTrace, ProxiedAccount } from './types'

// ==================== Explorer API ====================

/**
 * 直接调用 Explorer API
 */
async function explorerRequest<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const searchParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
  }

  const queryString = searchParams.toString()
  const url = `${environment.apiUrl}${path}${queryString ? '?' + queryString : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Explorer API Error: ${response.status}`)
  }

  const text = await response.text()
  if (!text) return null as T

  try {
    return JSON.parse(text)
  } catch {
    return { data: text } as T
  }
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

// ==================== 外部 API ====================

/**
 * 获取 BP 节点状态
 * 外部 API: fibos123.com/bp_status
 */
export async function getBpStatus(): Promise<BpStatusResponse> {
  const response = await fetch(environment.bpStatusUrl)

  if (!response.ok) {
    throw new Error(`BP Status API Error: ${response.status}`)
  }

  return response.json()
}
