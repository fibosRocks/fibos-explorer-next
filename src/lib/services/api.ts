/**
 * REST API 服务
 * 封装对 FIBOS Explorer API 的调用
 * 参考原项目各组件中的 HTTP 请求
 */

import { environment } from '@/lib/config/environment'
import type {
  ApiProducer,
  StatsResponse,
  AccountTrace,
  ResourcePrice,
  BpStatusResponse,
} from './types'

const API_BASE = environment.apiUrl

/**
 * 通用 API 请求函数
 */
async function apiRequest<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ==================== 统计和搜索 ====================

/**
 * 获取统计数据
 * GET /stats
 */
export async function getStats(): Promise<StatsResponse> {
  return apiRequest<StatsResponse>('/stats')
}

/**
 * 搜索
 * GET /search?query=xxx
 */
export async function search(query: string): Promise<{ type: string; value: string } | null> {
  return apiRequest<{ type: string; value: string } | null>('/search', { query })
}

// ==================== 生产者和投票 ====================

/**
 * 获取生产者列表
 * GET /producers
 */
export async function getProducers(): Promise<ApiProducer[]> {
  return apiRequest<ApiProducer[]>('/producers')
}

/**
 * 获取生产者投票统计
 * GET /vote?producer=xxx
 */
export async function getProducerVote(producer: string): Promise<unknown> {
  return apiRequest('/vote', { producer })
}

/**
 * 获取投票者列表
 * GET /voter?producer=xxx&page=x
 */
export async function getVoters(producer: string, page = 1): Promise<unknown> {
  return apiRequest('/voter', { producer, page })
}

/**
 * 获取代理列表
 * GET /proxies
 */
export async function getProxies(): Promise<unknown[]> {
  return apiRequest<unknown[]>('/proxies')
}

/**
 * 获取代理关系
 * GET /proxy?proxy=xxx&page=x
 */
export async function getProxyRelations(proxy: string, page = 1): Promise<unknown> {
  return apiRequest('/proxy', { proxy, page })
}

// ==================== 区块链浏览器 ====================

/**
 * 获取区块列表
 * GET /blocks?page=x
 */
export async function getBlocks(page = 1): Promise<unknown> {
  return apiRequest('/blocks', { page })
}

/**
 * 获取交易列表
 * GET /transactions?page=x
 */
export async function getTransactions(page = 1): Promise<unknown> {
  return apiRequest('/transactions', { page })
}

/**
 * 获取交易详情
 * GET /transaction/{id}
 */
export async function getTransaction(id: string): Promise<unknown> {
  return apiRequest(`/transaction/${id}`)
}

/**
 * 获取账户列表
 * GET /accounts?page=x
 */
export async function getAccounts(page = 1): Promise<unknown> {
  return apiRequest('/accounts', { page })
}

/**
 * 获取账户交易历史
 * GET /accountTraces?name=xxx&page=x
 */
export async function getAccountTraces(name: string, page = 1): Promise<AccountTrace[]> {
  return apiRequest<AccountTrace[]>('/accountTraces', { name, page })
}

// ==================== 合约 ====================

/**
 * 获取合约详情
 * GET /contract/{contract}
 */
export async function getContract(contract: string): Promise<{ hash: string; abi: unknown; actions: unknown[] }> {
  return apiRequest(`/contract/${contract}`)
}

/**
 * 获取合约列表
 * GET /contracts
 */
export async function getContracts(): Promise<unknown[]> {
  return apiRequest<unknown[]>('/contracts')
}

/**
 * 获取合约交易追踪
 * GET /contractTraces?contract=xxx&action=xxx&pending=xxx&page=x
 */
export async function getContractTraces(options: {
  contract: string
  action?: string
  pending?: boolean
  page?: number
}): Promise<unknown> {
  return apiRequest('/contractTraces', {
    contract: options.contract,
    action: options.action || '',
    pending: options.pending ? 'true' : 'false',
    page: options.page || 1,
  })
}

// ==================== 资源 ====================

/**
 * 获取资源价格
 * GET /resource
 */
export async function getResourcePrice(): Promise<ResourcePrice> {
  return apiRequest<ResourcePrice>('/resource')
}

/**
 * 获取 FO RAM 价格历史
 * GET /fo_ram_history
 */
export async function getFoRamHistory(): Promise<unknown> {
  return apiRequest('/fo_ram_history')
}

// ==================== 外部 API ====================

/**
 * 获取 BP 节点状态 (外部 API)
 * GET https://api.fibos123.com/bp_status
 */
export async function getBpStatus(): Promise<BpStatusResponse> {
  const response = await fetch(environment.bpStatusUrl)

  if (!response.ok) {
    throw new Error(`BP Status API Error: ${response.status}`)
  }

  return response.json()
}
