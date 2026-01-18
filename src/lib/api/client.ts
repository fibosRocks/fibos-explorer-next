/**
 * 客户端 API 工具函数
 * 用于静态页面直接调用后端 API，无需经过 Next.js API Routes 代理
 */

import { environment } from '@/lib/config/environment'
import Eos from 'eosjs-classic-fibos'

/**
 * 直接调用 FIBOS RPC
 */
export async function rpcCall<T = unknown>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`${environment.blockchainUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`RPC Error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * 直接调用 Explorer API
 */
export async function explorerApi<T = unknown>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const searchParams = params ? new URLSearchParams(params) : null
  const url = `${environment.apiUrl}${path}${searchParams ? '?' + searchParams : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error: ${response.status} - ${errorText}`)
  }

  const text = await response.text()
  if (!text) {
    return null as T
  }

  try {
    return JSON.parse(text)
  } catch {
    return { data: text } as T
  }
}

/**
 * 获取 BP 状态
 */
export async function getBpStatus(): Promise<{ rows2: unknown[] }> {
  try {
    const response = await fetch(environment.bpStatusUrl)

    if (!response.ok) {
      return { rows2: [] }
    }

    return response.json()
  } catch (error) {
    console.error('BP Status error:', error)
    return { rows2: [] }
  }
}

// eosjs-classic-fibos 类型定义不完整，需要扩展
const EosModules = Eos as unknown as {
  modules: {
    Fcbuffer: {
      fromBuffer: (struct: unknown, buffer: Buffer) => unknown
    }
  }
}

// ABI 缓存
const abiCache: Record<string, unknown> = {}

/**
 * 获取合约 ABI
 */
async function getAbi(account: string): Promise<unknown> {
  if (abiCache[account]) {
    return abiCache[account]
  }

  try {
    const response = await fetch(`${environment.blockchainUrl}/v1/chain/get_abi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_name: account }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data.abi) {
      abiCache[account] = data.abi
    }
    return data.abi
  } catch {
    return null
  }
}

interface ParsedAction {
  account: string
  name: string
  authorization: { actor: string; permission: string }[]
  data: Record<string, unknown>
}

interface ParsedTransaction {
  expiration: string
  ref_block_num: number
  ref_block_prefix: number
  max_net_usage_words?: number
  max_cpu_usage_ms?: number
  delay_sec?: number
  actions: ParsedAction[]
}

/**
 * 客户端解析 packed_transaction
 */
export async function parsePackedTransaction(packedTransaction: string): Promise<ParsedTransaction> {
  // 创建 Eos 实例用于解析
  const eos = Eos({
    httpEndpoint: environment.blockchainUrl,
    chainId: environment.chainId,
  })

  const Fcbuffer = EosModules.modules.Fcbuffer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactionStruct = (eos as any).fc.structs.transaction

  // 将十六进制转换为 Buffer 并解析
  const buffer = Buffer.from(packedTransaction, 'hex')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = Fcbuffer.fromBuffer(transactionStruct, buffer) as any

  // 解析每个 action 的 data
  const parsedActions: ParsedAction[] = []
  for (const action of tx.actions) {
    const { account, name, authorization, data } = action

    let parsedData = data

    // 尝试解析 action data
    if (data && typeof data === 'string') {
      try {
        const abi = await getAbi(account)
        if (abi) {
          // 将 ABI 加载到 cache
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(eos as any).fc.abiCache.abi(account, abi)

          // 获取 action 的结构定义
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actionStruct = (eos as any).fc.abiCache.abi(account).structs[name]
          if (actionStruct) {
            const dataBuffer = Buffer.from(data, 'hex')
            parsedData = Fcbuffer.fromBuffer(actionStruct, dataBuffer)
          }
        }
      } catch (err) {
        // 解析失败时保留原始数据
        console.error(`Failed to parse action data for ${account}::${name}:`, err)
      }
    }

    parsedActions.push({
      account,
      name,
      authorization,
      data: parsedData as Record<string, unknown>,
    })
  }

  return {
    expiration: tx.expiration,
    ref_block_num: tx.ref_block_num,
    ref_block_prefix: tx.ref_block_prefix,
    max_net_usage_words: tx.max_net_usage_words,
    max_cpu_usage_ms: tx.max_cpu_usage_ms,
    delay_sec: tx.delay_sec,
    actions: parsedActions,
  }
}
