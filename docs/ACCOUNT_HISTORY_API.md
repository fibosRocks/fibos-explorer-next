# 新增用户交易历史接口（cursor 分页）

## Context

当前账户详情页 "加载更多" 一直返回空。根因是新项目走 `/v1/history/get_actions`，后端把 `pos` 当 `global_sequence`（TEXT 字段），而前端把 `account_action_seq - 1` 当下一页 cursor 传过去 —— 字段含义不一致，下一页查不到任何记录。

老项目通过分支判断（FIBOS 链时改用 `global_action_seq - 1`）绕过这个问题，但 `get_actions` 这套 API 本身分页语义就很糟糕：
- `pos` / `offset` 双参数，正负号决定方向，client 必须自己算下一页
- `global_sequence` 在 SQLite 里是 `text(64)`，做 `<=` 比较是字符串比较，长度变化时排序错乱
- 响应里没显式 `next_cursor` / `has_more`，全靠 client 推断
- LIB 走单独的 RPC，慢且偶尔超时

新设计一个用户交易历史接口，不再兼容 `get_actions`，用更干净的 cursor 分页。

## Design

### 接口

```
GET /v1/account-history/:account?cursor=<int>&limit=<int>
```

参数：
- `:account` (path) — 账户名，必填
- `cursor` (query, optional) — 上一页响应里的 `next_cursor`；首屏不传
- `limit` (query, optional) — 1..100，默认 20

响应：

```jsonc
{
  "items": [
    {
      "action_id": 982314,                  // server PK，作为 cursor 用，client 不解释
      "global_sequence": "9876543",         // 仅作展示/调试
      "trx_id": "abc123...",
      "block_num": 12345678,
      "block_time": "2024-01-01T00:00:00.500",
      "act": {
        "account": "fibos.token",
        "name": "transfer",
        "authorization": [{"actor":"alice","permission":"active"}],
        "data": { "from":"alice","to":"bob","quantity":"1.0000 FO","memo":"" },
        "hex_data": "..."
      }
    }
    // newest first
  ],
  "next_cursor": 982294,        // 下一页传回；null = 到底
  "has_more": true,
  "last_irreversible_block": 87654321
}
```

### 为什么用 `action_id` 当 cursor

- `fibos_account_actions` 主键 `(account, action_id)`，`action_id` 是 `fibos_actions.id` 的自增 INTEGER —— 严格单调、本地稳定、可复用复合索引做 DESC 范围扫描。
- 不用 `global_sequence`：它是 `text(64)`，跨长度比较会错。
- cursor 是 server-internal 的不透明数值，client 只负责回传。

## 改动文件（前端部分）

### `src/app/api/account-history/[account]/route.ts`（新建）

Next.js 代理路由。透传 `cursor` / `limit` 到 `${environment.filterUrl}/v1/account-history/${account}?...`。

### `src/lib/services/types.ts`（新增类型）

```ts
export interface AccountHistoryItem {
  action_id: number
  global_sequence: string
  trx_id: string
  block_num: number
  block_time: string
  act: Action
}

export interface AccountHistoryResponse {
  items: AccountHistoryItem[]
  next_cursor: number | null
  has_more: boolean
  last_irreversible_block: number
}
```

### `src/lib/services/eos-client.ts`（新增 client 函数）

```ts
export async function getAccountHistory(
  account: string,
  cursor: number | null,
  limit = 20,
): Promise<AccountHistoryResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor != null) params.set('cursor', String(cursor))
  const res = await fetch(`/api/account-history/${account}?${params}`)
  if (!res.ok) throw new Error(`AccountHistory ${res.status}`)
  return res.json()
}
```

### `src/components/features/account-traces.tsx`（重写 fetchTraces）

- state 用 `cursor: number | null = null`、`hasMore: boolean = true`
- 首屏 `getAccountHistory(account, null, 20)`；点击加载更多 `getAccountHistory(account, cursor, 20)`
- 响应 `items` 已是 newest-first，直接遍历分组成 `GroupedTrace[]`
- 跨页 trx 合并：新批次第一条若 `trx_id === prev[prev.length-1].trx_id`，把它的 actions 追到上一组而不是新建组
- `setCursor(resp.next_cursor)`；`setHasMore(resp.has_more)`
- 加载更多按钮根据 `hasMore` 控制显隐

> 现有的 `eos.getActions` 调用路径保留，别处可能在用；只把 `account-traces.tsx` 切到新接口。

## 关键文件 & 行号

- 后端新建文件：`fibos-tracker-history-api/api/account-history.js`
- 后端入口注册：`fibos-tracker-history-api/index.js:43-49`
- 数据 schema：`fibos-explorer-tracker/lib/defs/fibos_account_actions.js:1-24`、`fibos_actions.js:1-63`
- 前端新建代理路由：`src/app/api/account-history/[account]/route.ts`
- 前端类型：`src/lib/services/types.ts:195-230` 附近新增
- 前端 client：`src/lib/services/eos-client.ts:41-55`
- 前端组件：`src/components/features/account-traces.tsx:33-115`

## 验证

前端：

1. `bun dev` 起服务
2. 进 `/explorer/accounts/<某活跃账户>`，确认首屏 20 条交易渲染正确
3. 点击 "加载更多"，确认追加 20 条、按钮仍可见
4. 一直点到底，确认按钮消失
5. 跨页 trx：人工挑一个含多 action 的 trx 落在分页边界的账户，确认 UI 上该 trx 的所有 action 仍在同一卡片里

## 不在范围

- 旧 `/v1/history/get_actions` 不动，保留兼容
- 不引入按 `action_name` / `contract` 过滤的参数（留作 v2）
- 不做服务端 trx 分组（前端分组够用）
- `global_sequence` schema 不改
