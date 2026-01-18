# 静态页面迁移方案

## 概述

将 fibos-explorer-next 从 Next.js 动态应用改为纯静态页面（Static Export），移除对 Vercel Serverless 的依赖。

## 当前架构

### API Routes

| 路由 | 功能 | 改造方案 |
|------|------|----------|
| `/api/rpc` | FIBOS RPC 代理 | 客户端直连 `fibos-tracker.chains.one` |
| `/api/explorer` | Explorer API 代理 | 客户端直连 `fibos-tracker.chains.one/explorer` |
| `/api/external/bp-status` | BP 状态代理 | 客户端直连 `api.fibos123.com/bp_status` |
| `/api/parse-transaction` | 解析 packed_transaction | 移动到客户端工具函数 |

### CORS 验证

所有外部 API 都支持 CORS：
```
fibos-tracker.chains.one: Access-Control-Allow-Origin: *
api.fibos123.com: Access-Control-Allow-Origin: *
```

## 实现步骤

### 1. 修改 next.config.ts

添加静态导出配置：
```typescript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // 静态导出不支持图片优化
  },
  // 其他配置...
}
```

### 2. 创建客户端 API 工具函数

创建 `src/lib/api/client.ts`：
- `rpcCall(path, data)` - 直接调用 RPC
- `explorerApi(path, params)` - 直接调用 Explorer API
- `getBpStatus()` - 获取 BP 状态
- `parsePackedTransaction(hex)` - 客户端解析交易

### 3. 修改组件调用

将所有 `/api/*` 调用替换为直接 API 调用。

涉及的文件：
- `src/app/(explorer)/explorer/*/page.tsx` - 区块链浏览器页面
- `src/app/(wallet)/wallet/*/page.tsx` - 钱包相关页面
- `src/app/(voting)/voting/page.tsx` - 投票页面
- `src/stores/walletStore.ts` - 钱包状态管理

### 4. 删除 API Routes

删除 `/src/app/api` 目录。

### 5. 构建验证

```bash
bun run build  # 应该生成 out/ 目录
```

## 详细代码修改

### src/lib/api/client.ts（新建）

```typescript
import { environment } from '@/lib/config/environment'
import Eos from 'eosjs-classic-fibos'

/**
 * 直接调用 FIBOS RPC
 */
export async function rpcCall<T = any>(path: string, data?: any): Promise<T> {
  const response = await fetch(`${environment.blockchainUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    throw new Error(`RPC Error: ${response.status}`)
  }

  return response.json()
}

/**
 * 直接调用 Explorer API
 */
export async function explorerApi<T = any>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const searchParams = new URLSearchParams(params)
  const url = `${environment.apiUrl}${path}${params ? '?' + searchParams : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * 获取 BP 状态
 */
export async function getBpStatus() {
  const response = await fetch(environment.bpStatusUrl)

  if (!response.ok) {
    return { rows2: [] }
  }

  return response.json()
}

/**
 * 客户端解析 packed_transaction
 */
export async function parsePackedTransaction(packedTransaction: string) {
  // 缓存 ABI
  const abiCache: Record<string, any> = {}

  async function getAbi(account: string) {
    if (abiCache[account]) return abiCache[account]

    const response = await fetch(`${environment.blockchainUrl}/v1/chain/get_abi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_name: account }),
    })

    if (!response.ok) return null

    const data = await response.json()
    if (data.abi) abiCache[account] = data.abi
    return data.abi
  }

  const eos = Eos({
    httpEndpoint: environment.blockchainUrl,
    chainId: environment.chainId,
  })

  const EosModules = Eos as any
  const Fcbuffer = EosModules.modules.Fcbuffer
  const transactionStruct = (eos as any).fc.structs.transaction

  const buffer = Buffer.from(packedTransaction, 'hex')
  const tx = Fcbuffer.fromBuffer(transactionStruct, buffer)

  const parsedActions = []
  for (const action of tx.actions) {
    const { account, name, authorization, data } = action
    let parsedData = data

    if (data && typeof data === 'string') {
      try {
        const abi = await getAbi(account)
        if (abi) {
          ;(eos as any).fc.abiCache.abi(account, abi)
          const actionStruct = (eos as any).fc.abiCache.abi(account).structs[name]
          if (actionStruct) {
            const dataBuffer = Buffer.from(data, 'hex')
            parsedData = Fcbuffer.fromBuffer(actionStruct, dataBuffer)
          }
        }
      } catch (err) {
        console.error(`Failed to parse action data for ${account}::${name}:`, err)
      }
    }

    parsedActions.push({ account, name, authorization, data: parsedData })
  }

  return {
    expiration: tx.expiration,
    ref_block_num: tx.ref_block_num,
    ref_block_prefix: tx.ref_block_prefix,
    actions: parsedActions,
  }
}
```

## 测试案例

### 功能测试

| 测试项 | 测试步骤 | 预期结果 |
|--------|----------|----------|
| 首页搜索 | 搜索账户/区块/交易 | 正确跳转到详情页 |
| 账户详情 | 访问 `/explorer/account/fibos` | 显示账户信息、余额、权限 |
| 区块详情 | 访问 `/explorer/block/1` | 显示区块信息和交易列表 |
| 交易详情 | 访问交易页面 | 显示交易详情和 actions |
| BP 列表 | 访问 `/voting` | 显示 BP 列表和投票信息 |
| 钱包连接 | 点击连接钱包 | 成功连接 Ironman 插件 |
| 转账 | 执行转账操作 | 成功发送交易 |
| 投票 | 执行投票操作 | 成功投票 |
| 多签查询 | 查询多签提案 | 显示提案列表和批准状态 |
| 多签操作 | 批准/撤销/执行多签 | 操作成功 |
| 交易解析 | 展开多签交易详情 | 正确显示解析后的 action 数据 |

### 性能测试

| 测试项 | 测试方法 | 预期结果 |
|--------|----------|----------|
| API 延迟 | 对比代理 vs 直连响应时间 | 直连快 10-50ms |
| 页面加载 | Lighthouse 测试 | 分数持平或提升 |

### 兼容性测试

- Chrome / Edge / Safari / Firefox
- 移动端浏览器
- Ironman 钱包插件

## 部署选项

改为静态后可部署到：

1. **GitHub Pages**
   ```bash
   # 构建后推送 out/ 目录到 gh-pages 分支
   ```

2. **Cloudflare Pages**
   ```bash
   # 连接 GitHub 仓库，设置构建命令
   Build command: bun run build
   Output directory: out
   ```

3. **任意静态服务器**
   ```bash
   bun run build
   # 将 out/ 目录部署到服务器
   ```

## 回滚方案

如果静态化后发现问题：
1. 删除 `output: 'export'` 配置
2. 恢复 API Routes
3. 将组件调用改回 `/api/*`

代码变更都在 git 中，可随时回滚。
