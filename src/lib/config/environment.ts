/**
 * FIBOS 链环境配置
 * 参考原项目: /src/environments/fibos/configs/environment.ts
 */

export const environment = {
  // API 端点
  apiUrl: 'https://fibos-tracker.chains.one/explorer',
  blockchainUrl: 'https://fibos-tracker.chains.one',
  filterUrl: 'https://fibos-tracker.chains.one',

  // 链配置
  chain: 'fibos',
  chainId: '6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a',
  coreSymbol: 'FO',
  prefix: 'FO',

  // 系统合约
  systemContract: 'eosio',
  tokenContract: 'eosio.token',
  msigContract: 'eosio.msig',

  // 外部 API
  bpStatusUrl: 'https://api.fibos123.com/bp_status',
}

/**
 * 网络配置（用于钱包连接）
 */
export const networkConfig = {
  blockchain: environment.chain,
  chainId: environment.chainId,
  host: 'fibos-tracker.chains.one',
  port: 443,
  protocol: 'https' as const,
}
