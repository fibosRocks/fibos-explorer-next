import Eos from 'eosjs-classic-fibos'

const FIBOS_CHAIN_ID = '6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a'
const FIBOS_RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://to-rpc.fibos.io'

/**
 * 创建 FIBOS EOS 客户端实例
 */
export function createEosClient(config?: { httpEndpoint?: string }) {
  return Eos({
    httpEndpoint: config?.httpEndpoint || FIBOS_RPC_ENDPOINT,
    chainId: FIBOS_CHAIN_ID,
    verbose: false,
  })
}

/**
 * 默认 EOS 客户端实例
 */
export const eosClient = createEosClient()

/**
 * EOS Service - 封装常用的链查询方法
 */
export class EosService {
  private eos: any

  constructor(endpoint?: string) {
    this.eos = createEosClient({ httpEndpoint: endpoint })
  }

  /**
   * 获取链信息
   */
  async getInfo() {
    return this.eos.getInfo({})
  }

  /**
   * 获取账户信息
   */
  async getAccount(accountName: string) {
    return this.eos.getAccount(accountName)
  }

  /**
   * 获取区块信息
   */
  async getBlock(blockNumOrId: string | number) {
    return this.eos.getBlock(blockNumOrId)
  }

  /**
   * 获取交易信息
   */
  async getTransaction(txId: string) {
    return this.eos.getTransaction(txId)
  }

  /**
   * 获取表数据
   */
  async getTableRows(params: {
    code: string
    scope: string
    table: string
    json?: boolean
    lower_bound?: string
    upper_bound?: string
    limit?: number
  }) {
    return this.eos.getTableRows(
      params.json ?? true,
      params.code,
      params.scope,
      params.table,
      params.lower_bound || '',
      params.upper_bound || '',
      '',
      params.limit || 100
    )
  }

  /**
   * 获取代币余额
   */
  async getCurrencyBalance(
    contract: string,
    accountName: string,
    symbol?: string
  ) {
    return this.eos.getCurrencyBalance(contract, accountName, symbol)
  }

  /**
   * 获取账户代币余额（所有代币）
   */
  async getAccountBalances(accountName: string) {
    // FIBOS 主要代币合约
    const contracts = ['eosio', 'eosio.token']
    const balances = []

    for (const contract of contracts) {
      try {
        const result = await this.getCurrencyBalance(contract, accountName)
        balances.push(...result)
      } catch (error) {
        console.error(`Failed to get balance from ${contract}:`, error)
      }
    }

    return balances
  }

  /**
   * 获取生产者列表
   */
  async getProducers(limit = 100) {
    return this.getTableRows({
      code: 'eosio',
      scope: 'eosio',
      table: 'producers',
      limit,
    })
  }
}

/**
 * 默认 EOS 服务实例
 */
export const eosService = new EosService()
