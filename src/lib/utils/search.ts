/**
 * 搜索工具函数
 * 根据输入内容智能判断搜索类型并返回跳转路径
 */

const FIBOS_PREFIX = 'FO'
const PREFIX_LENGTH = FIBOS_PREFIX.length

export type SearchType =
  | 'account'      // 账户
  | 'block'        // 区块
  | 'transaction'  // 交易
  | 'publickey'    // 公钥
  | 'invalid'      // 无效

export interface SearchResult {
  type: SearchType
  path: string
  query: string
}

/**
 * 智能搜索路由
 *
 * 规则:
 * - 纯数字 12 位 -> 账户
 * - 纯数字其他位数 -> 区块
 * - FO 开头 -> 公钥
 * - 64 位 hex -> 交易 ID
 * - 其他字符 -> 账户
 */
export function parseSearchQuery(query: string): SearchResult {
  const trimmed = query.trim()

  if (!trimmed) {
    return {
      type: 'invalid',
      path: '/',
      query: trimmed,
    }
  }

  const queryInt = Number(trimmed)

  // 纯数字
  if (!isNaN(queryInt)) {
    if (trimmed.length === 12) {
      // 12 位数字可能是账户名（如 fiboscouncil -> 数字账户）
      return {
        type: 'account',
        path: `/explorer/accounts?id=${trimmed}`,
        query: trimmed,
      }
    } else {
      // 其他位数的数字是区块号
      return {
        type: 'block',
        path: `/explorer/blocks?id=${trimmed}`,
        query: trimmed,
      }
    }
  }

  // FO 开头 -> 公钥
  if (trimmed.substring(0, PREFIX_LENGTH) === FIBOS_PREFIX) {
    return {
      type: 'publickey',
      path: `/explorer/publickey?key=${trimmed}`,
      query: trimmed,
    }
  }

  // 64 位 hex -> 交易 ID
  if (trimmed.length === 64 && /^[a-fA-F0-9]{64}$/.test(trimmed)) {
    return {
      type: 'transaction',
      path: `/explorer/transactions?id=${trimmed}`,
      query: trimmed,
    }
  }

  // 默认按账户名处理
  return {
    type: 'account',
    path: `/explorer/accounts?id=${trimmed}`,
    query: trimmed,
  }
}
