import { NextRequest, NextResponse } from 'next/server'
import { environment } from '@/lib/config/environment'
import Eos from 'eosjs-classic-fibos'

// 缓存 ABI
const abiCache: Record<string, any> = {}

// eosjs-classic-fibos 类型定义不完整，需要扩展
const EosModules = Eos as unknown as {
  modules: {
    Fcbuffer: {
      fromBuffer: (struct: any, buffer: Buffer) => any
    }
  }
}

/**
 * 获取合约 ABI
 */
async function getAbi(account: string): Promise<any> {
  if (abiCache[account]) {
    return abiCache[account]
  }

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
}

/**
 * 解析 packed_transaction API
 * 将十六进制的 packed_transaction 解析为可读的交易结构
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packed_transaction } = body

    if (!packed_transaction) {
      return NextResponse.json({ error: 'Missing packed_transaction' }, { status: 400 })
    }

    // 创建 Eos 实例用于解析
    const eos = Eos({
      httpEndpoint: environment.blockchainUrl,
      chainId: environment.chainId,
    })

    // 使用 Fcbuffer 解析 packed_transaction
    const Fcbuffer = EosModules.modules.Fcbuffer
    const transactionStruct = (eos as any).fc.structs.transaction

    // 将十六进制转换为 Buffer 并解析
    const buffer = Buffer.from(packed_transaction, 'hex')
    const tx = Fcbuffer.fromBuffer(transactionStruct, buffer)

    // 解析每个 action 的 data
    const parsedActions = []
    for (const action of tx.actions) {
      const { account, name, authorization, data } = action

      let parsedData = data

      // 尝试解析 action data
      if (data && typeof data === 'string') {
        try {
          const abi = await getAbi(account)
          if (abi) {
            // 将 ABI 加载到 cache
            ;(eos as any).fc.abiCache.abi(account, abi)

            // 获取 action 的结构定义
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
        data: parsedData,
      })
    }

    return NextResponse.json({
      expiration: tx.expiration,
      ref_block_num: tx.ref_block_num,
      ref_block_prefix: tx.ref_block_prefix,
      max_net_usage_words: tx.max_net_usage_words,
      max_cpu_usage_ms: tx.max_cpu_usage_ms,
      delay_sec: tx.delay_sec,
      actions: parsedActions,
    })
  } catch (error) {
    console.error('Parse transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to parse transaction', details: String(error) },
      { status: 500 }
    )
  }
}
