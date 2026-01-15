declare module 'eosjs-classic-fibos' {
  interface EosConfig {
    chainId: string
    httpEndpoint: string
    keyProvider?: string | string[]
    expireInSeconds?: number
    broadcast?: boolean
    verbose?: boolean
    debug?: boolean
    sign?: boolean
  }

  interface Eos {
    getInfo(): Promise<any>
    getBlock(blockNumOrId: string | number): Promise<any>
    getAccount(accountName: string): Promise<any>
    getTableRows(params: {
      json?: boolean
      code: string
      scope: string
      table: string
      lower_bound?: string | number
      upper_bound?: string | number
      limit?: number
      key_type?: string
      index_position?: number
    }): Promise<any>
    getActions(accountName: string, pos?: number, offset?: number): Promise<any>
    getTransaction(id: string): Promise<any>
    getCurrencyBalance(code: string, account: string, symbol?: string): Promise<string[]>
    getKeyAccounts(publicKey: string): Promise<{ account_names: string[] }>
    contract(accountName: string): Promise<any>
    transaction(actions: any): Promise<any>
  }

  function Eos(config: EosConfig): Eos
  export default Eos
}
