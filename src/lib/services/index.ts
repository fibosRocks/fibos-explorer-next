/**
 * 服务层导出
 *
 * 服务分类:
 * - eos: 服务端 EOS 节点 RPC 调用
 * - eosClient: 客户端 EOS 节点 RPC 调用 (通过 /api/rpc 代理)
 * - api: 服务端后端 API 调用
 * - apiClient: 客户端后端 API 调用 (通过 /api/explorer 代理)
 */

// 类型
export * from './types'

// 服务端 EOS RPC 服务
export * as eos from './eos'

// 客户端 EOS RPC 服务 (通过代理)
export * as eosClient from './eos-client'

// 服务端 REST API 服务
export * as api from './api'

// 客户端 REST API 服务 (通过代理)
export * as apiClient from './api-client'
