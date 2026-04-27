# Transaction Action Renderer System

## Context

`/explorer/transactions/[id]` 现在把每个 action 的 `data` 字段都用 `JSON.stringify` 输出到 `<pre>` 块（`src/app/(main)/explorer/transactions/[id]/page.tsx:265-274`、`311-319`），普通用户看不出"这是一笔 1 FO 转账"还是"这是 RAM 买卖"。`account-traces.tsx:176-196` 已经手动给 `transfer` 写了一段美化逻辑，但只覆盖一种 action、并且是写死的内联代码，不易扩展。

老项目 `eoseco-explorer-frontend/src/app/components/shared/page/data/data.component.html` 也只单独处理了 `transfer` 与 `eosio.token::extransfer`，其余仍是 JSON 字符串。

本次目标：搭建一个可扩展的 **action 渲染器注册表**，覆盖 FIBOS 上常见的 4 类 action（代币、资源、投票/多签、账户与权限），交易详情页用"详情模板"展示，账户交易历史用"简洁模板"展示，未识别的 action 回退到 JSON。

## Architecture

### 1. 注册表 + 双模板（核心设计）

新建 `src/lib/transaction/action-renderers.tsx`：

```ts
export type ActionKey = `${string}::${string}` | `*::${string}`

export interface ActionRendererContext {
  account: string
  name: string
  data: Record<string, unknown>
}

export interface ActionRenderer {
  key: ActionKey                // 如 'eosio.token::extransfer'，'*::transfer'
  category: 'token' | 'resource' | 'vote' | 'msig' | 'auth'
  icon: LucideIcon              // 用于 Badge 着色与图标
  /** 一行简洁版 — 给 account-traces 用 */
  Summary: React.FC<ActionRendererContext>
  /** 多行详情版 — 给交易详情页用 */
  Detail: React.FC<ActionRendererContext>
}

export function lookupRenderer(account: string, name: string): ActionRenderer | null
```

查找顺序：精确匹配 `${account}::${name}` → 通配匹配 `*::${name}`（用于 `transfer` 这种任意合约都可能发的 action）→ `null`（落到 JSON 回退）。

### 2. 共享渲染组件

新建 `src/components/features/action-card.tsx`：

```tsx
<ActionCard action={action} index={i} variant="detail" />   // 交易详情页
<ActionCard action={action} variant="summary" />            // account-traces
```

- `variant="detail"`：渲染完整卡片头（图标 + `name @ contract` + Authorization chips + Detail 渲染体 + 折叠的 Raw JSON 区块），找不到渲染器时整块退化为现有 JSON pre。
- `variant="summary"`：渲染单行（badge + Summary），找不到渲染器时退化为现有 `account-traces.tsx:193-195` 的合约名灰字。
- 折叠按钮用本地 `useState`，默认收起；展开时复用 `<pre>` 样式。

### 3. 首期 Renderer 列表

| Key | Category | Detail 展示 | Summary 展示 |
|---|---|---|---|
| `*::transfer` | token | from → to / quantity / memo（多行） | from → to · quantity（已有逻辑迁移过来） |
| `eosio.token::extransfer` | token | from → to / `quantity@contract` / memo | from → to · `quantity@contract` |
| `eosio.token::issue` | token | issuer → to / quantity / memo | issuer → to · quantity |
| `eosio::buyram` | resource | payer → receiver / quant | payer → receiver · quant |
| `eosio::buyrambytes` | resource | payer → receiver / bytes | payer → receiver · `${bytes}B` |
| `eosio::sellram` | resource | account / bytes | account · `-${bytes}B` |
| `eosio::delegatebw` | resource | from → receiver / NET / CPU / transfer 标记 | from → receiver · NET+CPU |
| `eosio::undelegatebw` | resource | from → receiver / unstake NET / CPU | from → receiver · unstake |
| `eosio::voteproducer` | vote | voter / proxy 或 producers[] | voter · `${n} producers` 或 `→ proxy` |
| `eosio::regproxy` | vote | proxy / isproxy(bool) | proxy · register/unregister |
| `eosio::regproducer` | vote | producer / url / location | producer · register |
| `eosio::claimrewards` | vote | owner | owner · claim |
| `eosio.msig::propose` | msig | proposer / proposal_name | proposer / name |
| `eosio.msig::approve` | msig | proposer / proposal_name / level | actor approves name |
| `eosio.msig::unapprove` | msig | proposer / proposal_name / level | actor unapproves name |
| `eosio.msig::cancel` | msig | proposer / proposal_name / canceler | name cancelled |
| `eosio.msig::exec` | msig | proposer / proposal_name / executer | name executed |
| `eosio::newaccount` | auth | creator → name + 权限摘要 | creator → name |
| `eosio::updateauth` | auth | account / permission / parent / threshold + 摘要 | account · permission |
| `eosio::deleteauth` | auth | account / permission | account · 删除 permission |
| `eosio::linkauth` / `unlinkauth` | auth | account / code / type / requirement | account · code::type |

约定：
- **所有解析出来是账户名的字段一律渲染为可点击的 `<AccountLink name={...} />`**（封装为 `src/lib/transaction/action-renderers.tsx` 内部的小组件，用 `<Link href="/explorer/accounts/{name}">`，沿用 `transactions/[id]/page.tsx:230-235` 的紫/青色样式）。各 renderer 中需要变成链接的字段清单：
  - transfer / extransfer / issue：`from`、`to`、`issuer`
  - buyram / buyrambytes：`payer`、`receiver`
  - sellram：`account`
  - delegatebw / undelegatebw：`from`、`receiver`
  - voteproducer：`voter`、`proxy`、`producers[]` **每一项都点击可跳转**
  - regproxy：`proxy`
  - regproducer：`producer`
  - claimrewards：`owner`
  - msig::propose：`proposer`、`requested[].actor`
  - msig::approve / unapprove：`proposer`、`level.actor`
  - msig::cancel：`proposer`、`canceler`
  - msig::exec：`proposer`、`executer`
  - newaccount：`creator`、`name`（被创建账户）、`owner.accounts[].permission.actor`、`active.accounts[].permission.actor`
  - updateauth：`account`、`auth.accounts[].permission.actor`
  - deleteauth：`account`
  - linkauth / unlinkauth：`account`、`code`
- 数量字段 (`quantity`, `quant`, `stake_*_quantity`) 用 `whitespace-nowrap font-medium`。
- extransfer 中 `quantity.contract` 也是合约账户，同样作为 `<AccountLink>` 渲染。
- 类别 `category` 决定 badge 颜色与图标（token=绿/`ArrowRightLeft`，resource=蓝/`Database`，vote=紫/`Vote`，msig=琥珀/`Users`，auth=粉/`Key`）。

### 4. Raw JSON 折叠交互

`ActionCard` 在 `variant="detail"` 且匹配到 renderer 时，底部加：

```tsx
<button onClick={...}>
  <ChevronDown /> {t('transaction.rawData')}
</button>
{open && <pre>{JSON.stringify(action.data, null, 2)}</pre>}
```

未匹配 renderer 时不显示按钮，直接展开 JSON（保留现有 fallback 行为）。

### 5. i18n

`src/lib/i18n/en.json` 与 `zh.json` 的 `transaction` 命名空间新增：
- `transaction.rawData` / `rawDataHide`
- `transaction.action.*`：每类 action 的字段/动作描述（`from`、`to`、`quantity`、`memo`、`producers`、`stakeNet`、`stakeCpu`、`transferStake`、`bytes`、`approves`、`executes` …）

## Files

**新建**
- `src/lib/transaction/action-renderers.tsx` — 注册表 + 各 renderer 的 `Summary` / `Detail` 组件
- `src/lib/transaction/types.ts`（可选；如果类型较多再拆，否则放在 `action-renderers.tsx` 顶部）
- `src/components/features/action-card.tsx` — `<ActionCard variant="detail|summary">`

**修改**
- `src/app/(main)/explorer/transactions/[id]/page.tsx:218-323` — 用 `<ActionCard variant="detail">` 替换主 actions 与 inline actions 的渲染体
- `src/components/features/account-traces.tsx:165-200` — 用 `<ActionCard variant="summary">` 替换 transfer 的内联逻辑
- `src/lib/i18n/en.json` & `zh.json` — 添加 `transaction.rawData`、`transaction.action.*`

**不修改**
- `src/app/api/parse-transaction/route.ts`（多签 packed_transaction 解析与本次无关）
- `src/lib/services/types.ts`（`Action` 类型已够用）

## Verification

1. `bun dev` 启动后访问以下交易（如本地无样本可用 `eos.getTransaction()` 查近期块）：
   - 一笔 `eosio.token::transfer` → 详情页应显示 `from → to · quantity · memo`，下方有"查看 Raw"按钮。
   - 一笔 `eosio.token::extransfer` → quantity 显示 `1.0000 USDT@otherc`。
   - 一笔包含 `eosio::delegatebw` 的交易 → NET / CPU 分行显示，transfer 标记。
   - 一笔 `eosio.msig::approve` → 显示 proposer / proposal_name / level。
   - 一笔未识别 action（例如自定义合约的 random action）→ 退化为 JSON pre 块，行为与改动前一致。
2. 访问 `/explorer/accounts/{name}` 看交易历史：
   - transfer 行仍是 `from → to quantity` 单行，不应高于一行。
   - 资源/投票/多签的 action 也应有简短一行摘要而不是仅显示合约名。
3. 在交易详情页和账户交易历史里，所有从 action.data 解析出来的账户名都应可点击并跳转到 `/explorer/accounts/{name}`，包括 `producers[]` 数组中的每一项、msig 的 `level.actor`、newaccount 的嵌套权限里的 `accounts[].permission.actor` 等。
4. 切换中英文，所有 action 字段标签随语言切换。
5. `bun run lint` / `bun run build` 通过。

## Out of Scope

- 多签内 `packed_transaction` 的内嵌 action 渲染（已有 `/api/parse-transaction`，未来可让 msig::propose 的 Detail 调用它递归渲染，本次仅显示 proposer/proposal_name）。
- 自动从 ABI 推断未注册 action 字段（按需后续再加）。
