# FIBOS Explorer 重构技术栈选型 (2025-2026)

基于当前前端技术发展趋势和项目特点，本文档提供技术栈选型建议。

---

## 兼容性验证 ✅

**测试日期**: 2026-01-15

已通过 `scripts/bun-compat-test/` 验证 eosjs-classic-fibos 与 Bun 的兼容性：

| 运行时 | 版本 | 测试结果 |
|--------|------|----------|
| Bun | 1.3.6 | ✅ 10/10 通过 |
| Node.js | 12.22.12 | ✅ 10/10 通过 |

测试覆盖：模块加载、链信息查询、账户查询、表数据、余额、Fcbuffer、ECC 公钥验证、crypto、Buffer

---

## 技术栈总览

| 层级 | 确定技术 | 备选方案 |
|------|----------|----------|
| **运行时** | Bun 1.3+ ⭐ | Node.js 20+ |
| **框架** | Next.js 15+ | - |
| **UI库** | shadcn/ui + Radix UI | - |
| **样式** | Tailwind CSS 4 | - |
| **状态管理** | Zustand + TanStack Query | - |
| **构建工具** | Turbopack (内置) | - |
| **类型系统** | TypeScript 5.x | - |
| **测试** | bun test + Playwright | Vitest |
| **包管理** | bun ⭐ | pnpm |

> ⭐ 表示经过兼容性验证确认的选择

---

## 一、运行时与包管理：Bun

### 为什么选择 Bun

**版本**: 1.3.6 (2026年1月)

**核心优势**:
1. **极速安装** - 比 npm 快 25x，74 个包 1.38 秒完成
2. **一体化工具** - 运行时 + 包管理 + 打包器 + 测试器
3. **原生 TypeScript** - 无需编译步骤，直接运行 .ts 文件
4. **Node.js 兼容** - 目标 100% API 兼容，支持 Node.js v23 标准
5. **内置功能** - SQL、Redis、S3 客户端开箱即用
6. **Vercel 支持** - 原生支持 Bun Runtime

### Bun 特有能力

```typescript
// 内置 SQL (Postgres, MySQL, SQLite)
import { sql } from "bun";
const users = await sql`SELECT * FROM users WHERE id = ${id}`;

// 内置 S3
const s3 = Bun.s3({ bucket: "my-bucket" });
await s3.write("hello.txt", "Hello world");

// 原生运行 TypeScript
// bun run src/index.ts  (无需 ts-node)
```

### 配置示例

```json
// package.json
{
  "packageManager": "bun@1.3.6",
  "scripts": {
    "dev": "bun --bun next dev",
    "build": "bun --bun next build",
    "start": "bun --bun next start",
    "test": "bun test",
    "test:e2e": "bunx playwright test",
    "lint": "bun --bun next lint",
    "typecheck": "bunx tsc --noEmit"
  }
}
```

### 锁文件

Bun 使用 `bun.lock`（文本格式，Git 友好），也支持读取 `package-lock.json` 和 `yarn.lock`。

---

## 二、前端框架：Next.js 15+

### 为什么选择 Next.js

**npm 下载量**: 1600万+/周 (2025年数据)

**优势**:
1. **React 生态成熟** - React 周下载量 5600万+，社区最活跃
2. **App Router** - 基于 React Server Components 的新架构
3. **Turbopack** - Next.js 16 默认构建器，比 Webpack 快 10x
4. **全栈能力** - API Routes 可处理简单后端逻辑
5. **缓存优化** - `use cache` 指令，Partial Pre-Rendering
6. **企业级支持** - Vercel 公司背书，长期维护

**Next.js 15/16 新特性**:
- React 19 完整支持
- `next/form` 组件 - 客户端导航增强
- `after` API - 响应后执行代码
- 异步请求 API (`cookies`, `headers`, `params`)
- 改进的错误 UI 和调试体验
- 稳定的 Node.js Middleware

### 项目结构建议

```
src/
├── app/                    # App Router 页面
│   ├── (public)/           # 公开页面组
│   │   ├── page.tsx        # 首页
│   │   ├── explorer/       # 浏览器模块
│   │   │   ├── blocks/
│   │   │   ├── transactions/
│   │   │   └── accounts/
│   │   ├── nodes/          # 节点模块
│   │   └── voting/         # 投票模块
│   ├── (wallet)/           # 需登录页面组
│   │   └── wallet/
│   │       ├── overview/
│   │       ├── transfer/
│   │       ├── resources/
│   │       └── advanced/
│   ├── api/                # API 路由
│   └── layout.tsx          # 根布局
├── components/
│   ├── ui/                 # shadcn/ui 组件
│   ├── features/           # 业务组件
│   └── layouts/            # 布局组件
├── lib/
│   ├── eos/                # EOS/FIBOS SDK 封装
│   ├── wallet/             # 钱包连接逻辑
│   └── utils/              # 工具函数
├── hooks/                  # 自定义 Hooks
├── stores/                 # Zustand stores
└── types/                  # TypeScript 类型
```

---

## 三、UI 组件库：shadcn/ui

### 为什么选择 shadcn/ui

**不是传统 npm 包，而是代码复制模式**

**核心优势**:
1. **完全可控** - 组件代码在你的项目中，可任意修改
2. **零运行时依赖** - 无版本锁定风险
3. **基于 Radix UI** - 无障碍访问 (a11y) 开箱即用
4. **Tailwind 原生** - 与 Tailwind CSS 4 完美配合
5. **持续更新** - 社区活跃，持续添加新组件

### 组件安装示例

```bash
# 初始化
npx shadcn@latest init

# 按需添加组件
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add form
```

### FIBOS Explorer 需要的核心组件

| 组件 | 用途 |
|------|------|
| `Button` | 所有按钮 |
| `Card` | 资产卡片、统计卡片 |
| `Table` | 区块列表、交易列表 |
| `Form` + `Input` | 转账、抵押表单 |
| `Dialog` | 交易确认弹窗 |
| `Tabs` | 账户详情、资源管理标签 |
| `Toast` | 操作提示（替代 layer.js） |
| `Select` | 代币选择、节点选择 |
| `Progress` | 资源使用率进度条 |
| `Skeleton` | 加载状态 |
| `Badge` | 状态标签 |
| `Tooltip` | 信息提示 |

---

## 四、样式方案：Tailwind CSS 4

### 为什么选择 Tailwind CSS

1. **性能飞跃** - v4 "Oxide" 引擎大幅提升编译速度
2. **原子化 CSS** - 无 CSS 冲突，极致的包体积优化
3. **设计系统** - 内置设计规范，保证一致性
4. **现代 CSS** - 原生支持 Container Queries、Subgrid
5. **工具链** - Prettier 插件自动排序 class

### Tailwind CSS 4 新特性

- 全新高性能引擎 (Oxide)
- 重新设计的配置体验
- 文字阴影 (Text Shadows) 工具类
- 遮罩 (Masks) 工具类
- 更好的现代浏览器特性支持

### 主题配置示例

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // FIBOS 品牌色
        primary: {
          50: '#f0f9ff',
          500: '#1890ff',
          600: '#0284c7',
          700: '#0369a1',
        },
        // 语义色
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

---

## 五、状态管理

### 客户端状态：Zustand

**为什么选择 Zustand**:
- 极简 API，约 1KB 体积
- 无需 Provider 包裹
- TypeScript 友好
- 支持 DevTools
- 中间件系统灵活

```typescript
// stores/wallet.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  accountName: string | null
  walletType: 'scatter' | 'ironman' | 'ledger' | null
  isConnected: boolean

  // Actions
  connect: (type: WalletType) => Promise<void>
  disconnect: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      accountName: null,
      walletType: null,
      isConnected: false,

      connect: async (type) => {
        // 连接逻辑
        set({ walletType: type, isConnected: true })
      },

      disconnect: () => {
        set({ accountName: null, walletType: null, isConnected: false })
      },
    }),
    { name: 'wallet-storage' }
  )
)
```

### 服务器状态：TanStack Query

**为什么选择 TanStack Query**:
- 声明式数据获取
- 自动缓存和重新验证
- 后台更新
- 分页和无限滚动支持
- 乐观更新

```typescript
// hooks/useAccount.ts
import { useQuery } from '@tanstack/react-query'
import { eosService } from '@/lib/eos'

export function useAccount(accountName: string) {
  return useQuery({
    queryKey: ['account', accountName],
    queryFn: () => eosService.getAccount(accountName),
    staleTime: 10 * 1000, // 10秒内不重新请求
    refetchInterval: 30 * 1000, // 30秒自动刷新
  })
}

export function useAccountBalance(accountName: string) {
  return useQuery({
    queryKey: ['balance', accountName],
    queryFn: () => eosService.getCurrencyBalance(accountName),
    refetchInterval: 10 * 1000,
  })
}
```

---

## 六、构建工具：Turbopack

### Next.js 内置 Turbopack

Next.js 16 默认使用 Turbopack：
- Rust 编写，极致性能
- 增量编译
- 开发服务器秒启动

```bash
# 开发模式自动使用 Turbopack
next dev

# 生产构建
next build
```

### 独立项目可选 Vite

如果不使用 Next.js，Vite 是最佳选择：
- 原生 ES 模块
- 极快的 HMR
- Rollup 生产构建
- 框架无关

---

## 七、TypeScript 配置

### 推荐配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      { "name": "next" }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 八、测试策略

### 单元测试：bun test

Bun 内置测试运行器，API 兼容 Jest：

```typescript
// __tests__/utils/format.test.ts
import { describe, it, expect } from 'bun:test'
import { formatBalance, formatBytes } from '@/lib/utils/format'

describe('formatBalance', () => {
  it('should format FO balance correctly', () => {
    expect(formatBalance('1234.5678 FO')).toBe('1,234.5678 FO')
  })
})

describe('formatBytes', () => {
  it('should convert bytes to KB', () => {
    expect(formatBytes(1024)).toBe('1.00 KB')
  })

  it('should convert bytes to MB', () => {
    expect(formatBytes(1048576)).toBe('1.00 MB')
  })
})
```

运行测试：

```bash
bun test                    # 运行所有测试
bun test --watch           # 监听模式
bun test --coverage        # 代码覆盖率
```

### E2E 测试：Playwright

```typescript
// e2e/transfer.spec.ts
import { test, expect } from '@playwright/test'

test('should complete a transfer', async ({ page }) => {
  await page.goto('/wallet/transfer')

  // 填写表单
  await page.fill('[name="recipient"]', 'testaccount1')
  await page.fill('[name="amount"]', '1.0000')

  // 提交
  await page.click('button[type="submit"]')

  // 验证结果
  await expect(page.locator('.toast-success')).toBeVisible()
})
```

---

## 九、开发工具链

### 必备工具

| 工具 | 用途 |
|------|------|
| **ESLint** | 代码检查 |
| **Prettier** | 代码格式化 |
| **Husky** | Git hooks |
| **lint-staged** | 提交前检查 |
| **Commitlint** | 提交信息规范 |

### 推荐 VSCode 插件

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (如用 Vue)
- GitLens

### package.json 脚本

```json
{
  "scripts": {
    "dev": "bun --bun next dev",
    "build": "bun --bun next build",
    "start": "bun --bun next start",
    "lint": "bun --bun next lint",
    "lint:fix": "bun --bun next lint --fix",
    "format": "bunx prettier --write .",
    "test": "bun test",
    "test:e2e": "bunx playwright test",
    "typecheck": "bunx tsc --noEmit"
  }
}
```

---

## 十、性能优化最佳实践

### 1. 代码分割

```typescript
// 动态导入
const WalletAdvanced = dynamic(() => import('@/components/wallet/Advanced'), {
  loading: () => <Skeleton />,
})
```

### 2. 图片优化

```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="FIBOS Logo"
  width={120}
  height={40}
  priority // 首屏关键图片
/>
```

### 3. 数据预取

```typescript
// 页面级预取
export async function generateMetadata({ params }) {
  const account = await getAccount(params.id)
  return { title: `Account: ${account.name}` }
}
```

### 4. 虚拟列表

大量数据使用虚拟滚动：

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function TransactionList({ transactions }) {
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })
  // ...
}
```

---

## 十一、FIBOS 特殊考虑

### 钱包集成架构

```typescript
// lib/wallet/adapter.ts
interface WalletAdapter {
  connect(): Promise<string>  // 返回账户名
  disconnect(): void
  sign(transaction: any): Promise<any>
  getAccountName(): string
}

class ScatterAdapter implements WalletAdapter { ... }
class IronmanAdapter implements WalletAdapter { ... }
class LedgerAdapter implements WalletAdapter { ... }
```

### FIBOS SDK 封装

```typescript
// lib/eos/client.ts
import Eos from 'eosjs-classic-fibos'

export function createEosClient(endpoint: string) {
  return Eos({
    httpEndpoint: endpoint,
    chainId: 'FIBOS_CHAIN_ID',
    // ...
  })
}
```

---

## 十二、迁移建议

### 渐进式迁移策略

| 阶段 | 任务 | 周期建议 |
|------|------|----------|
| **Phase 1** | 搭建 Next.js 项目骨架，配置开发环境 | - |
| **Phase 2** | 迁移核心服务（EosService, WalletService） | - |
| **Phase 3** | 实现浏览器模块（区块/交易/账户） | - |
| **Phase 4** | 实现钱包模块（转账/资源/概览） | - |
| **Phase 5** | 实现投票和节点模块 | - |
| **Phase 6** | 高级功能（多签/合约调用/Ledger） | - |
| **Phase 7** | 测试、优化、上线 | - |

### 代码复用策略

可以直接复用的部分：
- 业务逻辑（验证规则、计算函数）
- i18n 翻译文件
- API 调用逻辑（重构为 hooks）

需要重写的部分：
- 组件 UI（Angular → React）
- 状态管理（RxJS → Zustand/Query）
- 路由（Angular Router → App Router）

---

## 十三、总结

### 确定技术栈

```
Bun 1.3+ (运行时 + 包管理)
  └── Next.js 15+ (React 19)
        ├── shadcn/ui + Radix UI (组件)
        ├── Tailwind CSS 4 (样式)
        ├── Zustand (客户端状态)
        ├── TanStack Query (服务器状态)
        ├── TypeScript 5.x (类型)
        ├── bun test (单元测试)
        └── Playwright (E2E 测试)
```

### 为什么这套组合

1. **极速开发** - Bun 安装快 25x，原生 TypeScript 支持
2. **性能** - Next.js + Turbopack 提供最佳开发和运行时性能
3. **类型安全** - TypeScript 全栈类型覆盖
4. **开发体验** - shadcn/ui + Tailwind 高效开发
5. **可维护性** - 清晰的项目结构和状态管理
6. **生态兼容** - Bun 100% 兼容 Node.js 生态，无迁移风险
7. **已验证** - eosjs-classic-fibos 兼容性测试通过

---

## 参考资源

- [Bun 文档](https://bun.sh/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [TanStack Query 文档](https://tanstack.com/query)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
