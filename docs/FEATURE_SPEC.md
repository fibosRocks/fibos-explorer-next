# FIBOS Explorer 功能规格文档

本文档详细描述了 EOSeco Explorer (FIBOS 版本) 的所有功能细节，用于前端框架重构参考。

---

## 目录

1. [项目概述](#项目概述)
2. [核心服务层](#核心服务层)
3. [页面功能模块](#页面功能模块)
4. [工具模块 (/tools)](#工具模块-tools)
5. [FIBOS 特有功能](#fibos-特有功能)
6. [后端 API 接口](#后端-api-接口)
7. [钱包集成](#钱包集成)
8. [国际化](#国际化)

---

## 项目概述

FIBOS Explorer 是一个 EOSIO 区块链浏览器，专门针对 FIBOS 链进行了定制。主要功能包括：

- 区块、交易、账户浏览
- 智能合约查看
- 区块生产者投票
- 代币转账、抵押、RAM 买卖等钱包功能
- 多签提案管理
- 代理投票
- FIBOS 特有功能（锁仓解锁、投票分红等）

### 技术栈

- Angular 5.2.9
- eosjs-classic-fibos (FIBOS SDK)
- ngx-translate (国际化)
- ngx-webstorage (本地存储)
- RxJS 5.5.8
- LESS (样式)

---

## 核心服务层

### EosService (`src/app/services/eos.service.ts`)

**职责**: 初始化 FIBOS 区块链 SDK 连接

**功能**:
- 创建 `eos` 实例用于主要区块链交互
- 创建 `filter` 实例用于历史数据查询（使用 filterUrl 端点）
- FIBOS 链特殊处理：自定义 `getActions` 方法通过 HTTP POST 请求获取账户操作历史

**配置来源**: `environment.ts`
- `blockchainUrl`: 区块链 RPC 端点
- `filterUrl`: 历史数据过滤器端点
- `chainId`: 链 ID

**主要方法**:
```typescript
eos.getInfo({})                          // 获取区块链信息
eos.getBlock(id)                         // 获取区块详情
eos.getAccount(name)                     // 获取账户信息
eos.getTableRows(...)                    // 查询合约表数据
eos.getCurrencyBalance(contract, account, symbol)  // 获取代币余额
eos.getCurrencyStats(contract, symbol)   // 获取代币统计
filter.getActions(account, pos, offset)  // 获取账户操作历史
filter.getTransaction(txid)              // 获取交易详情
filter.getKeyAccounts(publicKey)         // 通过公钥查询关联账户
```

### IronmanService (`src/app/services/ironman.service.ts`)

**职责**: 管理钱包连接和交易签名

**支持的钱包类型**:
1. **Scatter** - 浏览器扩展钱包
2. **Ironman** - FIBOS 官方钱包插件
3. **MathWallet** - 麦子钱包
4. **Ledger** - 硬件钱包（蓝牙连接）

**主要状态**:
```typescript
accountName: string          // 当前登录账户名
accountPermission: string    // 当前权限 (active/owner)
account: {                   // 账户资源状态
  ram: { used, max, available }
  cpu: { used, max, available }
  net: { used, max, available }
  staked: number
  balance: string            // FO 余额
  eosBalance: string         // EOS 余额 (跨链资产)
  voteInfo: object
  voteNumber: number
  lastVoteWeight: string
}
pluginType: string           // 'scatter' | 'plugin' | 'ledger' | 'anchor'
hasPlugin: boolean           // 是否检测到钱包插件
```

**主要方法**:
```typescript
checkPlugin()                // 检测钱包插件
connectIdentity(type)        // 连接钱包获取账户身份
changeIdentity()             // 切换账户
getAccountName()             // 获取当前账户名
getPermission()              // 获取授权信息 { actor, permission }
getStatus(refreshFlag?)      // 获取账户状态（资源、余额等）
getInterface()               // 获取交易签名接口
getLedgerKey(mode, index)    // 获取 Ledger 公钥
setLedgerAccount(permission, index)  // 设置 Ledger 账户
```

**事件发射器**:
```typescript
accountNameEmitter   // 账户名变更事件
accountEmitter       // 账户状态变更事件
hasPluginEmitter     // 钱包插件检测事件
```

**交易签名流程**:
1. 调用 `getInterface()` 获取签名接口
2. 调用 `interface.transaction({ actions: [...] })` 执行交易
3. 交易返回 `{ transaction_id: string, ... }`

---

## 页面功能模块

### 1. 首页 Dashboard (`/`)

**文件**: `src/app/components/dashboard/dashboard.component.ts`

**功能**:
- 显示区块链统计信息（区块数、交易数等）
- 显示最新区块列表
- 显示最新交易列表
- 显示链 ID、LIB（最后不可逆区块）
- 全局搜索入口

**数据刷新**: 每 5 秒轮询

**API 调用**:
- `GET /stats` - 获取统计数据、最新区块和交易
- `eos.getInfo({})` - 获取链信息

**统计数据结构**:
```typescript
stats: [区块数, 交易数, 账户数, 操作数]
blocks: Block[]
transactions: Transaction[]
```

### 2. 区块列表 (`/blocks`)

**文件**: `src/app/components/blocks/blocks.component.ts`

**功能**:
- 分页展示区块列表
- 显示区块号、时间、生产者、交易数量

### 3. 区块详情 (`/blocks/:id`)

**文件**: `src/app/components/block/block.component.ts`

**功能**:
- 显示区块完整信息
- 显示区块内所有交易列表
- 区分待确认/已确认状态
- 显示原始 JSON 数据

**数据获取**:
```typescript
eos.getBlock(id)
eos.getInfo({})  // 获取 LIB 判断确认状态
```

**区块信息**:
- block_num, id, timestamp
- producer
- previous (前一区块)
- transaction_mroot
- action_mroot
- transactions[]

### 4. 交易列表 (`/transactions`)

**文件**: `src/app/components/transactions/transactions.component.ts`

**功能**:
- 分页展示交易列表
- 显示交易 ID、时间、状态、操作数

### 5. 交易详情 (`/transactions/:id`)

**文件**: `src/app/components/transaction/transaction.component.ts`

**功能**:
- 显示交易完整信息
- 显示所有 actions（包括 inline actions）
- 显示交易状态（Pending/Irreversible）
- 显示原始 JSON 数据

**数据获取**:
```typescript
filter.getTransaction(txid)
eos.getInfo({})  // 获取 LIB
```

**交易信息**:
- id, block_num, block_time
- status (Pending/Irreversible)
- actions[]: { account, name, authorization, data }
- inline_traces[]

### 6. 账户详情 (`/accounts/:id`)

**文件**: `src/app/components/account/account.component.ts`

**功能**:
- 显示账户基本信息
- 显示资源使用情况（RAM/CPU/NET）
- 显示余额信息（FO、EOS、其他代币）
- 显示锁仓金额（locked/unlocked）
- 显示抵押信息
- 显示投票信息
- 显示操作历史（分页加载）
- 显示收到的投票（如果是 BP）
- 显示代理信息

**数据获取**:
```typescript
eos.getAccount(name)
eos.getTableRows(true, "eosio.token", name, "accounts", ...)     // FIBOS 代币余额
eos.getTableRows(true, "eosio.token", name, "lockaccounts", ...) // 锁仓余额
filter.getActions(name, pos, offset)                              // 操作历史
GET /vote?producer={name}                                         // 收到的投票
GET /proxies                                                      // 代理列表
GET /voter?producer={name}&page={page}                            // 投票者列表
GET /proxy?proxy={name}&page={page}                               // 代理的投票者
```

**余额计算**:
```typescript
总余额 = staked + refund_cpu + refund_net + core_liquid_balance
为他人抵押 = staked - (self_cpu_weight + self_net_weight)
```

**资源显示**:
- RAM: used / max (bytes)
- CPU: used / max (μs)
- NET: used / max (bytes)

### 7. 智能合约详情 (`/contracts/:contract` `/contracts/:contract/:action`)

**文件**: `src/app/components/contract/contract.component.ts`

**功能**:
- 显示合约 ABI
- 按 action 过滤交易
- 显示合约相关交易列表（待确认/已确认）
- 动态构建交易表单（基于 ABI structs）

**数据获取**:
```typescript
GET /contract/{contract}  // 获取合约信息（hash, abi, actions）
GET /contractTraces?contract={}&action={}&page={}&pending={}
```

### 8. 区块生产者列表 (`/producers`)

**文件**: `src/app/components/producers/producers.component.ts`

**功能**:
- 显示 BP 列表和得票率
- 饼图展示得票分布

**数据获取**:
```typescript
GET /producers
```

### 9. 投票页面 (`/voting`)

**文件**: `src/app/components/voting/voting.component.ts`

**功能**:
- 显示所有活跃 BP 列表
- 选择/取消选择 BP（最多30个）
- 显示每个 BP 的：
  - 排名
  - 得票数/得票率
  - 预计每日收益
  - 可领取收益
  - 节点信息（从 producerjson 表读取）
- 生成投票邀请链接（URL hash 格式）
- 执行投票交易
- 更新 BP 信息（producerjson 合约）

**数据获取**:
```typescript
eos.getTableRows(true, "eosio", "eosio", "global", ...)      // 全局投票权重
eos.getTableRows(true, "eosio", "eosio", "producers", ...)   // BP 列表
GET /producers                                                 // 后端 BP 数据
eos.getAccount(accountName)                                   // 获取已投票的 BP
eos.getTableRows(true, "producerjson", "producerjson", "producerjson", ...) // BP 信息
eos.getCurrencyStats("eosio.token", "FO")                     // 代币发行量
```

**收益计算**:
```typescript
continuous_rate = 0.04879
daily_reward = continuous_rate * token_supply / 365 * 0.2 * 1.2
bpay = daily_reward * 0.2 / 21  // 出块奖励
vpay = daily_reward * 0.8 * (bp.total_votes / total_weight)  // 投票奖励
```

**投票交易**:
```typescript
{
  account: "eosio",
  name: "voteproducer",
  data: {
    voter: accountName,
    proxy: "",
    producers: ["bp1", "bp2", ...]  // 按字母排序
  }
}
```

### 10. 公钥查询 (`/publickey/:key`)

**文件**: `src/app/components/publickey/publickey.component.ts`

**功能**:
- 通过公钥查询关联的账户列表

**数据获取**:
```typescript
filter.getKeyAccounts(publicKey)
```

### 11. 搜索 (`/search`)

**文件**: `src/app/components/search/search.component.ts`

**搜索逻辑**:
- 纯数字 + 长度12：跳转账户详情
- 纯数字：跳转区块详情
- 以 "FO" 开头：跳转公钥查询
- 64位字符：跳转交易详情
- 其他：跳转账户详情

### 12. RAM 市场 (`/ram`)

**文件**: `src/app/components/ram/ram.component.ts`

**功能**:
- 显示 RAM 价格走势图（Highcharts）
- 显示当前 RAM 价格（FO/KB）
- 显示 RAM 使用率
- RAM 买入/卖出功能
- 显示 RAM 交易历史

**数据获取**:
```typescript
GET /resource                    // RAM 价格和使用情况
GET /fo_ram_history              // RAM 历史价格数据
GET /contractTraces?contract=eosio&action=buyram|sellram|buyrambytes
```

### 13. 设置 (`/settings`)

**文件**: `src/app/components/settings/settings.component.ts`

**功能**:
- 语言切换（中文/英文）

---

## 工具模块 (/tools)

所有工具都需要连接钱包后使用。

### 1. 转账 (`/tools/transfer`)

**文件**: `src/app/components/tools/transfer/transfer.component.ts`

**功能**:
- 多代币转账支持
- 显示可用余额
- 收款账户验证
- 添加备注

**FIBOS 特殊处理**:
- eosio 合约代币：使用 `transfer` action
- 其他合约代币：使用 `extransfer` action，数量格式为 `quantity@contract`

**交易结构**:
```typescript
// eosio 合约代币
{
  account: "eosio.token",
  name: "transfer",
  data: { from, to, quantity: "1.0000 FO", memo }
}

// 其他合约代币
{
  account: "eosio.token",
  name: "extransfer",
  data: { from, to, quantity: "1.0000 TOKEN@contract", memo }
}
```

**余额查询（FIBOS）**:
```typescript
eos.getTableRows(true, "eosio.token", accountName, "accounts", ...)
// 返回 rows[].balance = { quantity: "1.0000 FO", contract: "eosio" }
```

### 2. 创建账户 (`/tools/create`)

**文件**: `src/app/components/tools/create/create.component.ts`

**功能**:
- 创建新账户
- 设置 Owner/Active 公钥
- 设置初始 RAM（字节）
- 设置初始 CPU/NET 抵押
- 是否转移抵押所有权

**账户名验证**:
- 必须12位
- 只能包含 a-z 和 1-5
- 检查是否已存在

**公钥验证**:
- 使用 ecc.isValidPublic(key, "FO")

**交易结构（3个 actions）**:
```typescript
[
  {
    account: "eosio",
    name: "newaccount",
    data: {
      creator, name,
      owner: { threshold: 1, keys: [{ key, weight: 1 }], accounts: [], waits: [] },
      active: { threshold: 1, keys: [{ key, weight: 1 }], accounts: [], waits: [] }
    }
  },
  {
    account: "eosio",
    name: "buyrambytes",
    data: { payer, receiver, bytes }
  },
  {
    account: "eosio",
    name: "delegatebw",
    data: { from, receiver, stake_net_quantity, stake_cpu_quantity, transfer }
  }
]
```

### 3. 抵押/赎回 (`/tools/stake`)

**文件**: `src/app/components/tools/stake/stake.component.ts`

**功能**:
- **抵押 (Delegate)**:
  - 为自己或他人抵押 CPU/NET
  - 可选是否转移所有权
- **赎回 (Undelegate)**:
  - 显示已抵押给各账户的资源列表
  - 选择账户进行赎回
  - 不能赎回自己的全部资源

**抵押列表查询**:
```typescript
eos.getTableRows({
  code: "eosio",
  scope: accountName,
  table: "delband",
  limit: -1
})
// 返回 rows[].{ from, to, net_weight, cpu_weight }
```

**交易结构**:
```typescript
// 抵押
{
  account: "eosio",
  name: "delegatebw",
  data: { from, receiver, stake_net_quantity, stake_cpu_quantity, transfer }
}

// 赎回
{
  account: "eosio",
  name: "undelegatebw",
  data: { from, receiver, unstake_net_quantity, unstake_cpu_quantity }
}
```

### 4. RAM 买卖 (`/tools/ram`)

**文件**: `src/app/components/tools/ram/ram.component.ts`

**功能**:
- 购买 RAM（按 FO 金额或字节数）
- 出售 RAM（按字节数）
- 为他人购买 RAM

**交易结构**:
```typescript
// 按金额购买
{
  account: "eosio",
  name: "buyram",
  data: { payer, receiver, quant: "1.0000 FO" }
}

// 按字节购买
{
  account: "eosio",
  name: "buyrambytes",
  data: { payer, receiver, bytes }
}

// 出售
{
  account: "eosio",
  name: "sellram",
  data: { account, bytes }
}
```

### 5. 多签管理 (`/tools/multisig`)

**文件**: `src/app/components/tools/multisig/multisig.component.ts`

**功能**:
- 按提案者搜索多签提案
- 显示提案详情（解析 packed_transaction）
- 显示批准状态（已批准/待批准）
- 批准提案
- 执行提案

**数据获取**:
```typescript
eos.getTableRows(true, "eosio.msig", proposer, "approvals2", ...)  // 批准状态
eos.getTableRows(true, "eosio.msig", proposer, "proposal", ...)    // 提案内容
```

**解析 packed_transaction**:
```typescript
Eos.modules.Fcbuffer.fromBuffer(eos.fc.structs.transaction, Buffer.from(packed_transaction, 'hex'))
```

**交易结构**:
```typescript
// 批准
{
  account: "eosio.msig",
  name: "approve",
  data: { proposer, proposal_name, level: { actor, permission } }
}

// 执行
{
  account: "eosio.msig",
  name: "exec",
  data: { proposer, proposal_name, executer }
}
```

### 6. 代理投票 (`/tools/proxy`)

**文件**: `src/app/components/tools/proxy/proxy.component.ts`

**功能**:
- 显示代理列表（从 regproxyinfo 合约）
- 设置代理投票
- 注册为代理
- 取消代理注册
- 设置代理信息

**代理信息结构**:
```typescript
{
  owner: string,
  name: string,
  slogan: string,
  philosophy: string,
  background: string,
  website: string,
  logo: string,
  contact: string
}
```

**数据获取**:
```typescript
eos.getTableRows({ scope: "regproxyinfo", code: "regproxyinfo", table: "proxies" })
GET /proxies  // 代理投票数
```

**交易结构**:
```typescript
// 设置代理
{
  account: "eosio",
  name: "voteproducer",
  data: { voter, proxy, producers: [] }
}

// 注册代理
{
  account: "eosio",
  name: "regproxy",
  data: { proxy, isproxy: 1 }
}

// 设置代理信息
{
  account: "regproxyinfo",
  name: "set",
  data: { owner, name, slogan, ... }
}
```

### 7. Ledger 硬件钱包 (`/tools/ledger`)

**文件**: `src/app/components/tools/ledger/ledger.component.ts`

**功能**:
- 通过蓝牙连接 Ledger
- 获取 Ledger 公钥（可选索引）
- 搜索公钥关联的账户
- 选择账户登录

**连接流程**:
1. 用户点击连接，选择蓝牙设备
2. 获取指定索引的公钥
3. 通过公钥搜索关联账户
4. 用户选择账户和权限
5. 设置为当前登录账户

---

## FIBOS 特有功能

### 1. 资源面板 (`FibosResourceComponent`)

**文件**: `src/app/components/fibos/resource/resource.component.ts`

**功能**:
- 显示 RAM 价格和使用率
- 显示 CPU/NET 价格
- 显示 FO/USDT 价格（从 swapmarket 表读取）
- 显示 FO 总发行量

**数据获取**:
```typescript
GET /resource
eos.getTableRows(true, "eosio.token", "eosio.token", "swapmarket", ...)
```

### 2. 解锁锁仓 (`/tools/unlockfo`)

**文件**: `src/app/components/fibos/unlock/unlock.component.ts`

**功能**:
- 显示已到期可解锁的 FO 数量
- 批量解锁到期资产

**数据获取**:
```typescript
eos.getTableRows(true, "eosio.token", accountName, "lockaccounts", ...)
// 返回 rows[].{ balance: { quantity, contract }, lock_timestamp }
```

**解锁判断**:
```typescript
unlock_time = moment(item.lock_timestamp + 'Z')
if (unlock_time <= moment()) {
  // 可解锁
}
```

**交易结构（批量）**:
```typescript
{
  actions: [{
    account: "eosio.token",
    name: "exunlock",
    data: {
      owner: accountName,
      quantity: "1.0000 FO@eosio",
      expiration: lock_timestamp,
      memo: "unlock"
    }
  }, ...]
}
```

### 3. 投票分红 (`/tools/votebonus`)

**文件**: `src/app/components/tools/votebonus/votebonus.component.ts`

**功能**:
- 显示上次更新时间
- 显示已记录金额
- 计算可领取金额
- 领取分红
- 快速投票给 fibosrockskr

**分红计算**:
```typescript
claimableAmount = staked * 0.06 * (now - lastUpdateTime) / (365 * 24 * 60 * 60 * 1000) + recordedAmount
```

**数据获取**:
```typescript
eos.getTableRows(true, "eosio", "eosio", "record", ...)
```

**交易结构**:
```typescript
{
  account: "eosio",
  name: "claimbonus",
  data: { owner: accountName }
}
```

### 4. 投票奖励领取 (`/tools/claimforvote`)

**文件**: `src/app/components/tools/claimforvote/claimforvote.component.ts`

**功能**:
- 显示上次领取时间
- 显示违规时间
- 领取投票奖励

**数据获取**:
```typescript
eos.getTableRows(true, "claimforvote", "claimforvote", "claimer", ...)
```

**交易结构**:
```typescript
{
  account: "claimforvote",
  name: "claim",
  data: { user: accountName }
}
```

### 5. DEX 交换 (`/exchange`)

**文件**: `src/app/components/exchange/exchange.component.ts`

**功能（YAS 链实现，可参考）**:
- 代币兑换（AMM 模式）
- 添加流动性
- 移除流动性
- 显示价格走势图

**AMM 计算**:
```typescript
// 购买计算
received = inputAmount * (1 - feeRate)
if ((received / basePoolBalance) < maxChangeRate) {
  product = basePoolBalance * targetPoolBalance
  output = targetPoolBalance - (product / (received + basePoolBalance))
}
```

---

## 后端 API 接口

### 基础 URL
`environment.apiUrl` (例: `https://fibos-tracker.chains.one/explorer`)

### 接口列表

| 端点 | 方法 | 描述 | 返回 |
|------|------|------|------|
| `/stats` | GET | 首页统计数据 | `{ summaries: [], blocks: [], transactions: [] }` |
| `/resource` | GET | 资源价格信息 | `{ ram, cpu, net, ram_reserved, ram_total, eos_in_ram, total_fo }` |
| `/producers` | GET | BP 列表 | `[{ owner, total_votes, is_active, eos_votes, ... }]` |
| `/proxies` | GET | 代理列表 | `[{ proxy, proxied_vote }]` |
| `/vote?producer={name}` | GET | 账户收到的投票 | Vote 对象 |
| `/voter?producer={name}&page={n}` | GET | 投票给账户的人列表 | Voter[] |
| `/proxy?proxy={name}&page={n}` | GET | 代理给账户的人列表 | Voter[] |
| `/contract/{name}` | GET | 合约信息 | `{ hash, abi, actions }` |
| `/contractTraces` | GET | 合约交易列表 | Transaction[] |
| `/accountTraces?name={name}&page={n}` | GET | 账户交易列表 | Transaction[] |
| `/block/{id}` | GET | 区块详情 | Block 对象 |
| `/transaction/{id}` | GET | 交易详情 | Transaction 对象 |
| `/fo_ram_history` | GET | RAM 历史价格 | `{ code: 1, data: [[timestamp, price], ...] }` |

### 查询参数

`/contractTraces`:
- `contract`: 合约名
- `action`: action 名称
- `page`: 页码
- `pending`: `true` 查询待确认交易

---

## 钱包集成

### 支持的钱包

1. **Ironman/Scatter 插件**
   - 检测: `window.scatter` 或 `window.ironman`
   - 网络配置:
     ```typescript
     { blockchain: "fibos", host, port: 443, chainId, protocol: "https" }
     ```

2. **MathWallet**
   - 检测: `navigator.userAgent.indexOf("MathWallet") > -1`
   - 或 `window.scatter.isMathWallet`

3. **Ledger**
   - 使用 `@ledgerhq/hw-transport-web-ble`
   - 使用 `@qiushaoxi/hw-app-eosio`

### 交易签名统一接口

```typescript
const plugin = ironman.getInterface()
plugin.transaction({
  actions: [{
    account: "contract",
    name: "action",
    authorization: [{ actor, permission }],
    data: { ... }
  }]
}).then(res => {
  console.log(res.transaction_id)
})
```

---

## 国际化

### 支持语言
- 中文 (`zh`)
- 英文 (`en`)

### 翻译文件
- `src/assets/i18n/zh.json`
- `src/assets/i18n/en.json`

### 使用方式
```typescript
// 组件中
constructor(private translate: TranslateService) {}

// 切换语言
translate.use('zh')

// 获取翻译
translate.get('KEY').subscribe(text => ...)
```

### 模板中
```html
{{ 'KEY' | translate }}
```

---

## 配置文件结构

### environment.ts
```typescript
export const environment = {
  production: true,
  chain: "fibos",
  chainId: "6aa7bd33b6b45192465afa3553dedb531acaaff8928cf64b70bd4c5e49b7ec6a",
  coreSymbol: "FO",
  prefix: "FO",
  appName: 'FIBOS ROCKS Explorer',
  logoUrl: '/assets/logo.png',
  apiUrl: 'https://fibos-tracker.chains.one/explorer',
  blockchainUrl: 'https://fibos-tracker.chains.one',
  blockchainHostPort: 443,
  monitorUrl: 'https://fibos-tracker.chains.one',
  filterUrl: 'https://fibos-tracker.chains.one',
  blockchainHost: 'fibos-tracker.chains.one',
  reward_threshold: 100,
  accounts: {
    email: "fo@chains.one",
    github: "https://github.com/fibosRocks",
    myProducer: "fibosrockskr",
    myProxy: 'rockrockrock',
    systemContract: "eosio",
    tokenContract: "eosio.token",
    msigContract: "eosio.msig"
  },
  google: { GA_TRACKING_ID: 'UA-xxx' },
  tokens: [
    { symbol: 'FO', contract: 'eosio', precision: 4 },
    { symbol: 'EOS', contract: 'eosio', precision: 4 },
    { symbol: 'FOUSDT', contract: 'eosio', precision: 6 },
    // ...
  ]
}
```

---

## 数据模型

### Account
```typescript
interface Account {
  name: string
  ram: { used: number, max: number, available: number }
  cpu: { used: number, max: number, available: number }
  net: { used: number, max: number, available: number }
  core_liquid_balance: string
  voter_info?: {
    staked: number
    producers: string[]
    proxy: string
    last_vote_weight: string
  }
  refund_request?: {
    cpu_amount: string
    net_amount: string
  }
  self_delegated_bandwidth?: {
    cpu_weight: string
    net_weight: string
  }
  total_resources?: {
    cpu_weight: string
    net_weight: string
  }
}
```

### Block
```typescript
interface Block {
  block_num: number
  id: string
  timestamp: string
  producer: string
  previous: string
  transaction_mroot: string
  action_mroot: string
  transactions: Transaction[]
  pending: boolean
}
```

### Transaction
```typescript
interface Transaction {
  id: string
  block_num: number
  block_time: string
  status: 'Pending' | 'Irreversible'
  actions: Action[]
  traces: ActionTrace[]
}
```

### Action
```typescript
interface Action {
  account: string      // 合约账户
  name: string         // action 名称
  authorization: { actor: string, permission: string }[]
  data: any           // action 数据
  hex_data?: string   // 原始数据
}
```

### Producer
```typescript
interface Producer {
  owner: string
  total_votes: string
  producer_key: string
  is_active: boolean
  url: string
  unpaid_blocks: number
  last_claim_time: string
  rank?: number
  eos_votes?: number
}
```

---

## 第三方依赖

### 核心依赖
- `eosjs-classic-fibos` - FIBOS 区块链 SDK
- `@scatterjs/core`, `@scatterjs/eosjs2` - Scatter 钱包集成
- `@qiushaoxi/hw-app-eosio` - Ledger 硬件钱包

### UI 相关
- `moment` - 时间处理
- `angular2-prettyjson` - JSON 格式化显示
- `angular2-highlight-js` - 代码高亮
- `ngx-clipboard` - 剪贴板操作

### 图表（通过 CDN 引入）
- Highcharts (stockChart)
- Flot (饼图)

### 弹窗（通过 CDN 引入）
- layer.js
