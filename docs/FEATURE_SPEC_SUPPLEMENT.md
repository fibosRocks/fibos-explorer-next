# FIBOS Explorer 重构补充文档

本文档作为 `FEATURE_SPEC.md` 的补充，包含重构时需要的详细信息。

---

## 目录

1. [完整路由表](#完整路由表)
2. [表单验证规则](#表单验证规则)
3. [错误提示文案](#错误提示文案)
4. [UI 交互细节](#ui-交互细节)
5. [共享组件](#共享组件)
6. [数据刷新机制](#数据刷新机制)
7. [单位换算函数](#单位换算函数)

---

## 完整路由表

### 主路由

| 路径 | 组件 | 说明 | 需登录 |
|------|------|------|--------|
| `/` | DashboardComponent | 首页 | 否 |
| `/blocks` | BlocksComponent | 区块列表 | 否 |
| `/blocks/:id` | BlockComponent | 区块详情 | 否 |
| `/transactions` | TransactionsComponent | 交易列表 | 否 |
| `/transactions/:id` | TransactionComponent | 交易详情 | 否 |
| `/accounts` | AccountsComponent | 账户列表（未实现） | 否 |
| `/accounts/:id` | AccountComponent | 账户详情 | 否 |
| `/contracts` | ContractsComponent | 合约列表 | 否 |
| `/contracts/:contract` | ContractComponent | 合约详情 | 否 |
| `/contracts/:contract/:action` | ContractComponent | 合约指定 action | 否 |
| `/search` | SearchComponent | 搜索跳转 | 否 |
| `/producers` | ProducersComponent | BP 列表 | 否 |
| `/voting` | VotingComponent | 投票页面 | 否* |
| `/publickey/:key` | PublicKeyComponent | 公钥查询 | 否 |
| `/ram` | RamComponent | RAM 市场 | 否 |
| `/exchange` | ExchangeComponent | DEX（YAS专用） | 否 |
| `/monitor` | MonitorComponent | 节点监控 | 否 |
| `/settings` | SettingsComponent | 设置 | 否 |
| `/wallets` | WalletsComponent | 钱包介绍 | 否 |
| `/links` | LinksComponent | 推荐链接 | 否 |
| `/sending` | SendingComponent | 发送交易（旧） | 否 |
| `/snapshots` | SnapshotsComponent | 映射查询（EOS） | 否 |

*投票操作需要登录钱包

### 工具模块路由 (`/tools/*`)

| 路径 | 组件 | 说明 | FIBOS可用 |
|------|------|------|-----------|
| `/tools/transfer` | ToolsTransferComponent | 转账 | ✓ |
| `/tools/create` | ToolsCreateComponent | 创建账户 | ✓ |
| `/tools/stake` | ToolsStakeComponent | 抵押/赎回 | ✓ |
| `/tools/ram` | ToolsRamComponent | RAM 买卖 | ✓ |
| `/tools/multisig` | ToolsMultisigComponent | 多签管理 | ✓ |
| `/tools/ledger` | ToolsLedgerComponent | Ledger 钱包 | ✓ |
| `/tools/proxy` | ToolsProxyComponent | 代理投票 | ✓ |
| `/tools/contract` | ToolsContractComponent | 合约调用 | ✓ |
| `/tools/votebonus` | VoteBonusComponent | 投票分红（FIBOS） | ✓ |
| `/tools/unlockfo` | UnlockFOComponent | 解锁 FO（FIBOS） | ✓ |
| `/tools/names` | ToolsNamesComponent | 账户名拍卖 | ✗ |
| `/tools/claimforvote` | ClaimForVoteComponent | 投票奖励（ENU） | ✗ |
| `/tools/rex` | ToolsRexComponent | REX（YAS） | ✗ |
| `/tools/votereward` | VoteRewardComponent | 投票挖矿（YAS） | ✗ |

### 路由守卫

目前没有实现路由守卫，工具页面通过检查 `accountName` 状态来判断登录。

---

## 表单验证规则

### 账户名验证

**字段**: 新账户名、收款账户、抵押接收者等

| 规则 | 条件 | 错误码 | 中文提示 | 英文提示 |
|------|------|--------|----------|----------|
| 非空 | `name == ""` | AccountIsEmpty | 账号为空 | Account Is Empty |
| 格式 | `!name.match('^([a-z1-5]){12}$')` | WrongAccountFormat | 账号格式错误 | Wrong Account Format |
| 已存在（创建时） | 账户已存在 | AccountExsit | 账号已存在 | Account Exsit |
| 不存在（转账时） | 账户不存在 | AccountNotExist | 账号不存在 | Account Not Exist |

**触发时机**:
- `blur`: 失焦时验证
- `keyup`/`keydown`: 输入时清除错误

### 公钥验证

**字段**: Owner 公钥、Active 公钥

| 规则 | 条件 | 错误码 | 中文提示 |
|------|------|--------|----------|
| 非空 | `key == ""` | OwnerPublicKeyIsEmpty / ActivePublicKeyIsEmpty | Owner/Active 公钥为空 |
| 格式 | `!ecc.isValidPublic(key, "FO")` | WrongPublicKeyFormat | 公钥格式错误 |

**公钥前缀**: FIBOS 使用 `FO` 前缀

### 抵押验证

**字段**: CPU 抵押、NET 抵押

| 规则 | 条件 | 错误码 | 中文提示 |
|------|------|--------|----------|
| 至少一个非空 | `!cpu && !net` | Cpu/NetBothEmpty | Cpu/Net 不能同时为空 |

### 金额验证

**字段**: 转账金额、RAM 数量

| 规则 | 条件 | 错误码 | 提示 |
|------|------|--------|------|
| 非空非零 | `quantity == 0 \|\| !quantity` | AmountIsEmpty | 金额为空 |

### 赎回验证

**业务规则**:
- 不能赎回自己账户的全部资源
- 提示: "无法赎回自身全部资源，请预留一部分"

```typescript
if (accountName == recipient && (net2 >= mynet || cpu2 >= mycpu)) {
  layer.msg("无法赎回自身全部资源，请预留一部分")
  return
}
```

### 投票验证

**业务规则**:
- 最多选择 30 个节点
- 提示: "最多能输入30个账户！！！"

---

## 错误提示文案

### 表单错误（i18n）

| 错误码 | 中文 | 英文 |
|--------|------|------|
| AccountIsEmpty | 账号为空 | Account Is Empty |
| WrongAccountFormat | 账号格式错误 | Wrong Account Format |
| AccountExsit | 账号已存在 | Account Exsit |
| AccountNotExist | 账号不存在 | Account Not Exist |
| OwnerPublicKeyIsEmpty | Owner 公钥为空 | Owner PublicKey is Empty |
| ActivePublicKeyIsEmpty | Active 公钥为空 | Active PublicKey is Empty |
| WrongPublicKeyFormat | 公钥格式错误 | Wrong Public Key Format |
| Cpu/NetBothEmpty | Cpu/Net 不能同时为空 | Cpu/Net Both Empty |
| AmountIsEmpty | 金额为空 | Amount Is Empty |

### 交易错误（layer.msg）

| 场景 | 提示 |
|------|------|
| 交易成功 | "OK!" |
| 交易失败 | "FAIL!" |
| 链上错误 | 解析 `errJson.error.details[0].message` 显示 |
| Ledger 未解锁 | "Please unlock Ledger,请解锁Ledger" |
| 搜索账户失败 | "search account error, 查找账户失败" |
| RAM 不足 | "余额不足" |
| 输入错误 | "请输入正确的数量" |
| 复制成功 | "复制成功！！！" |
| 节点已注销 | "该节点已注销" |

### 页面错误

| 场景 | 提示 | i18n键 |
|------|------|--------|
| 账户不存在 | 对不起，没有找到相应的账户信息 | AccountNotFound |
| 区块不存在 | 对不起，没有找到相应的区块信息 | BlockNotFound |
| 交易不存在 | 对不起，没有找到相应的交易信息 | TransactionNotFound |
| 合约不存在 | 对不起，没有找到相应的合约信息 | ContractNotFound |

---

## UI 交互细节

### 表单交互模式

**错误显示**:
```html
<div class="form-group" [ngClass]="error ? 'has-error has-feedback' : ''">
  <label>标签</label>
  <input (blur)="validate()" (keydown)="error=null">
  <span class="glyphicon form-control-feedback"></span>
  <span class="help-block">{{error|translate}}</span>
</div>
```

**验证时机**:
- `blur`: 失焦时执行验证
- `keydown`/`keyup`: 清除错误状态

### 交易状态显示

```html
<!-- 交易进行中 -->
<app-loading *ngIf="transactionDoing"></app-loading>

<!-- 交易完成 -->
<div *ngIf="transactionDone" class="panel panel-default">
  <div class="panel-heading">{{ 'TransactionResult' | translate }}</div>
  <div class="panel-body">
    {{ 'TransactionId' | translate }}:
    <a routerLink="/transactions/{{txid}}">{{txid}}</a>
  </div>
</div>
```

### 弹窗使用 (layer.js)

**消息提示**:
```typescript
layer.msg("OK!")
layer.msg("FAIL!")
layer.msg("复制成功！！！")
```

**确认对话框**:
```typescript
layer.confirm(message, { title: title }, function(index) {
  // 确认操作
  layer.close(index)
})
```

**富内容弹窗**:
```typescript
layer.open({
  type: 1,
  title: "标题",
  content: $('.selector'),
  area: "auto",
  maxWidth: "700",
  btn: ["关闭"],
  yes: function(index) {
    layer.closeAll()
  }
})
```

### 工具栏状态栏

每个工具页面顶部显示账户状态栏 `<app-statusbar>`:
- 账户名
- 可用余额 / 已抵押
- RAM 使用率（进度条）
- CPU 使用率（进度条）
- NET 使用率（进度条）

### 分页组件

分页使用手动实现:
```html
<button (click)="prevPage()" [disabled]="page==0">{{ 'Previous' | translate }}</button>
<span>{{ 'CurrentPage' | translate }}: {{page + 1}}</span>
<button (click)="nextPage()">{{ 'Next' | translate }}</button>
```

### 加载状态

```html
<app-loading *ngIf="loading"></app-loading>
```

### 单选切换

用于抵押/赎回、买入/卖出等场景:
```html
<label class="radio-inline">
  <input type="radio" name="options" value="option1" [(ngModel)]="direction">
  选项1
</label>
<label class="radio-inline">
  <input type="radio" name="options" value="option2" [(ngModel)]="direction">
  选项2
</label>

<div *ngIf="direction=='option1'">内容1</div>
<div *ngIf="direction=='option2'">内容2</div>
```

### 移动端适配

通过检测 `isWM` (是否麦子钱包/移动端) 显示不同布局:
```typescript
this.isWM = navigator.userAgent.indexOf("MathWallet") > -1
// 或
this.isWM = this.storage.retrieve("isWM")
```

---

## 共享组件

### PageComponent (`<app-page>`)

页面容器，包含 navbar、sidebar、footer

### NavbarComponent (`<app-navbar>`)

顶部导航栏:
- Logo
- 搜索框
- 语言切换
- 钱包连接按钮

### SidebarComponent (`<app-sidebar>`)

侧边导航:
- Dashboard
- Blocks
- Transactions
- Contracts
- Producers
- Voting
- Tools
- RAM
- Settings

### LoadingComponent (`<app-loading>`)

全局加载动画

### StatusBarComponent (`<app-statusbar>`)

工具页面账户状态栏

### TempleteComponent

JSON 数据展示模态框

---

## 数据刷新机制

### 自动刷新

使用 RxJS `TimerObservable`:

```typescript
import { TimerObservable } from 'rxjs/observable/TimerObservable'

TimerObservable.create(0, 5000)  // 立即开始，每5秒
  .takeWhile(() => this.alive)  // 组件存活时继续
  .subscribe(() => {
    this.loadData()
  })

ngOnDestroy() {
  this.alive = false  // 停止定时器
}
```

### 刷新周期

| 页面/组件 | 刷新周期 |
|-----------|----------|
| Dashboard | 5 秒 |
| FibosResource | 10 秒 |
| RAM 市场 | 5 秒 |
| Exchange | 10 秒 |

### 手动刷新

交易完成后刷新账户状态:
```typescript
this.ironman.getStatus(true).then(() => {
  layer.msg("OK!")
})
```

---

## 单位换算函数

### 时间换算 (CPU)

```typescript
timeCalculate(item: number): string {
  if (item > 3600000000) {
    return (item / 3600000000).toFixed(2) + " H"
  } else if (item > 60000000) {
    return (item / 60000000).toFixed(2) + " M"
  } else if (item > 1000000) {
    return (item / 1000000).toFixed(2) + " S"
  } else {
    return (item / 1000).toFixed(2) + " ms"
  }
}
```

输入单位: 微秒 (μs)

### 网络/存储换算 (NET/RAM)

```typescript
netCalculate(item: number): string {
  if (item > 1073741824) {
    return (item / 1073741824).toFixed(2) + " GB"
  } else if (item > 1048576) {
    return (item / 1048576).toFixed(2) + " MB"
  } else if (item > 1024) {
    return (item / 1024).toFixed(2) + " KB"
  } else {
    return item.toFixed(2) + " B"
  }
}
```

输入单位: 字节 (bytes)

### 百分比计算

```typescript
percentCalculate(used: string, max: string): string {
  const usedNum = parseFloat(used)
  const maxNum = parseFloat(max)
  if (usedNum == 0 || maxNum == 0) {
    return "0%"
  }
  return (usedNum / maxNum * 100).toFixed(4) + "%"
}
```

---

## 代币精度配置

从 environment.tokens 读取:

```typescript
tokens: [
  { symbol: 'FO', contract: 'eosio', precision: 4 },
  { symbol: 'EOS', contract: 'eosio', precision: 4 },
  { symbol: 'FOUSDT', contract: 'eosio', precision: 6 },
  // ...
]
```

转账时格式化:
```typescript
const quantity = amount.toFixed(precision) + " " + symbol
// 例: "1.0000 FO"
```

---

## 工具页面条件显示

基于链类型 (`environment.chain`) 控制菜单显示:

| 功能 | FIBOS | ENU | YAS |
|------|-------|-----|-----|
| 转账 | ✓ | ✓ | ✓ |
| 创建账户 | ✓ | ✓ | ✓ |
| 抵押/赎回 | ✓ | ✓ | ✓ |
| RAM 买卖 | ✓ | ✓ | ✓ |
| 多签管理 | ✓ | ✓ | ✓ |
| 合约调用 | ✓ | ✓ | ✓ |
| 代理投票 | ✓ | ✗ | ✓ |
| 账户名拍卖 | ✗ | ✓ | ✓ |
| 投票分红 | ✓ | ✗ | ✗ |
| 解锁 FO | ✓ | ✗ | ✗ |
| 投票奖励 | ✗ | ✓ | ✗ |
| REX | ✗ | ✗ | ✓ |

---

## 第三方 UI 库

### 通过 CDN 引入

```html
<!-- layer.js 弹窗 -->
<script src="https://cdn.bootcss.com/layer/3.1.1/layer.js"></script>

<!-- Highcharts 图表 -->
<script src="https://cdn.highcharts.com.cn/highstock/highstock.js"></script>

<!-- Flot 饼图 -->
<script src="https://cdn.bootcss.com/flot/0.8.3/jquery.flot.min.js"></script>
<script src="https://cdn.bootcss.com/flot/0.8.3/jquery.flot.pie.min.js"></script>
```

### NPM 依赖

```json
{
  "ngx-clipboard": "^9.0.0",          // 剪贴板
  "angular2-prettyjson": "^1.0.9",     // JSON 格式化
  "angular2-highlight-js": "^4.1.0",   // 代码高亮
  "ngx-webstorage": "^1.8.0",          // 本地存储
  "@ngx-translate/core": "^9.1.1",     // 国际化
  "moment": "^2.22.2"                   // 时间处理
}
```

---

## 样式说明

### CSS 框架

- Bootstrap 3.x (通过 CDN)
- Font Awesome 4.x (图标)
- 自定义 LESS 样式

### 主题色变量

位于 `src/environments/fibos/assets/var.less`:

```less
@primary-color: #1890ff;
@link-color: #1890ff;
// ...
```

### 响应式断点

使用 Bootstrap 默认断点:
- lg: >= 1200px
- md: >= 992px
- sm: >= 768px
- xs: < 768px
