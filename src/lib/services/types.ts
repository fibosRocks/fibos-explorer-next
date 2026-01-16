/**
 * 网络请求相关类型定义
 * 参考原项目数据结构
 */

// ==================== RPC 响应类型 ====================

/**
 * 区块链基础信息 (getInfo)
 */
export interface ChainInfo {
  chain_id: string
  head_block_num: number
  last_irreversible_block_num: number
  head_block_producer: string
  server_version_string: string
  head_block_time: string
}

/**
 * 资源限制
 */
export interface ResourceLimit {
  used: number
  available: number
  max: number
}

/**
 * 投票信息
 */
export interface VoterInfo {
  owner: string
  proxy: string
  producers: string[]
  staked: number
  last_vote_weight: string
  proxied_vote_weight: string
  is_proxy: number
}

/**
 * 退款请求
 */
export interface RefundRequest {
  owner: string
  request_time: string
  net_amount: string
  cpu_amount: string
}

/**
 * 自抵押带宽
 */
export interface SelfDelegatedBandwidth {
  from: string
  to: string
  net_weight: string
  cpu_weight: string
}

/**
 * 账户信息 (getAccount)
 */
export interface Account {
  account_name: string
  head_block_num: number
  head_block_time: string
  privileged: boolean
  last_code_update: string
  created: string
  ram_quota: number
  ram_usage: number
  net_weight: number
  cpu_weight: number
  net_limit: ResourceLimit
  cpu_limit: ResourceLimit
  voter_info?: VoterInfo
  refund_request?: RefundRequest
  self_delegated_bandwidth?: SelfDelegatedBandwidth
  total_resources?: {
    owner: string
    net_weight: string
    cpu_weight: string
    ram_bytes: number
  }
  core_liquid_balance?: string
  permissions: Permission[]
}

/**
 * 权限
 */
export interface Permission {
  perm_name: string
  parent: string
  required_auth: {
    threshold: number
    keys: { key: string; weight: number }[]
    accounts: { permission: { actor: string; permission: string }; weight: number }[]
    waits: { wait_sec: number; weight: number }[]
  }
}

/**
 * 区块信息 (getBlock)
 */
export interface Block {
  timestamp: string
  producer: string
  confirmed: number
  previous: string
  transaction_mroot: string
  action_mroot: string
  schedule_version: number
  id: string
  block_num: number
  ref_block_prefix: number
  transactions: BlockTransaction[]
}

/**
 * 区块中的交易
 */
export interface BlockTransaction {
  status: string
  cpu_usage_us: number
  net_usage_words: number
  trx: string | TransactionReceipt
}

/**
 * 交易回执
 */
export interface TransactionReceipt {
  id: string
  signatures: string[]
  compression: string
  packed_context_free_data: string
  packed_trx: string
  transaction: Transaction
}

/**
 * 交易
 */
export interface Transaction {
  expiration: string
  ref_block_num: number
  ref_block_prefix: number
  max_net_usage_words: number
  max_cpu_usage_ms: number
  delay_sec: number
  context_free_actions: Action[]
  actions: Action[]
}

/**
 * 动作
 */
export interface Action {
  account: string
  name: string
  authorization: { actor: string; permission: string }[]
  data: Record<string, unknown>
  hex_data?: string
}

/**
 * 生产者 (getProducers)
 */
export interface Producer {
  owner: string
  total_votes: string
  producer_key: string
  is_active: number
  url: string
  unpaid_blocks: number
  last_claim_time: string
  location: number
}

/**
 * getTableRows 响应
 */
export interface TableRowsResponse<T = unknown> {
  rows: T[]
  more: boolean
  next_key?: string
}

/**
 * getActions 响应
 */
export interface ActionsResponse {
  actions: ActionTrace[]
  last_irreversible_block: number
}

/**
 * 动作追踪
 */
export interface ActionTrace {
  global_action_seq: number
  account_action_seq: number
  block_num: number
  block_time: string
  action_trace: {
    action_ordinal: number
    creator_action_ordinal: number
    receipt: {
      receiver: string
      act_digest: string
      global_sequence: number
      recv_sequence: number
      auth_sequence: [string, number][]
      code_sequence: number
      abi_sequence: number
    }
    receiver: string
    act: Action
    context_free: boolean
    elapsed: number
    console: string
    trx_id: string
    block_num: number
    block_time: string
    producer_block_id: string
    inline_traces: ActionTrace[]
  }
}

/**
 * 交易响应 (getTransaction) - FIBOS 特定结构
 */
export interface TransactionResponse {
  id: string
  trx_id?: string
  block_num: number
  block_time: string
  last_irreversible_block?: number
  action_traces: TransactionActionTrace[]
  // 非 FIBOS 链的字段
  trx?: {
    trx: {
      actions: Action[]
    }
  }
  traces?: TransactionActionTrace[]
}

/**
 * 交易中的 Action Trace
 */
export interface TransactionActionTrace {
  act: Action
  inline_traces?: TransactionActionTrace[]
  receipt?: {
    receiver: string
  }
}

// ==================== REST API 响应类型 ====================

/**
 * 统计数据 (/stats)
 */
export interface StatsResponse {
  summaries: number[]
  blocks: unknown[]
  transactions: unknown[]
}

/**
 * API 生产者信息 (/producers)
 */
export interface ApiProducer {
  owner: string
  total_votes: string
  is_active: boolean
  eos_votes?: number
  rank?: number
}

/**
 * 搜索结果 (/search)
 */
export interface SearchResult {
  type: 'account' | 'block' | 'transaction' | 'publickey'
  value: string
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 账户交易历史 (/accountTraces)
 */
export interface AccountTrace {
  trx_id: string
  block_num: number
  block_time: string
  actions: Action[]
}

/**
 * 资源价格 (/resource)
 */
export interface ResourcePrice {
  ram_price: number
  cpu_price: number
  net_price: number
}

/**
 * BP 状态 (外部 API)
 */
export interface BpStatus {
  bpname: string
  number: number
  date: string | null
}

export interface BpStatusResponse {
  rows2: BpStatus[]
}

// ==================== 代币相关 ====================

/**
 * 代币余额 (eosio.token accounts 表)
 */
export interface TokenBalance {
  balance: {
    quantity: string
    contract: string
  }
}

/**
 * 锁仓代币 (eosio.token lockaccounts 表)
 */
export interface LockedBalance {
  balance: {
    quantity: string
    contract: string
  }
  lock_timestamp: number
}

// ==================== 投票相关 ====================

/**
 * 全局状态 (eosio global 表)
 */
export interface GlobalState {
  max_ram_size: string
  total_ram_bytes_reserved: string
  total_ram_stake: string
  last_producer_schedule_update: string
  total_unpaid_blocks: number
  total_activated_stake: string
  thresh_activated_stake_time: string
  last_pervote_bucket_fill: string
  pervote_bucket: number
  perblock_bucket: number
  total_producer_vote_weight: string
  last_name_close: string
}

/**
 * 生产者 JSON 信息 (producerjson 表)
 */
export interface ProducerJson {
  owner: string
  json: string
}

/**
 * 投票给节点的账户
 */
export interface ProducerVoter {
  owner: string
  staked: number
  last_vote_weight: string
  is_proxy: number
}
