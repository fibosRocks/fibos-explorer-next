# FIBOS Explorer - Next.js

FIBOS 区块链浏览器 - 使用 Next.js + Bun + Tailwind CSS 4 重构版本

## 技术栈

- **运行时**: Bun 1.3+
- **框架**: Next.js 15+ (React 19)
- **UI**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand + TanStack Query
- **类型**: TypeScript 5.x
- **测试**: bun test + Playwright
- **区块链**: eosjs-classic-fibos

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # 公开页面
│   │   ├── explorer/       # 浏览器模块
│   │   ├── nodes/          # 节点模块
│   │   └── voting/         # 投票模块
│   ├── (wallet)/           # 需登录页面
│   │   └── wallet/
│   │       ├── overview/
│   │       ├── transfer/
│   │       ├── resources/
│   │       └── advanced/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── globals.css         # 全局样式
├── components/
│   ├── ui/                 # shadcn/ui 组件
│   ├── features/           # 业务组件
│   └── layouts/            # 布局组件
├── lib/
│   ├── eos/                # EOS/FIBOS SDK 封装
│   ├── wallet/             # 钱包连接逻辑
│   └── utils/              # 工具函数
├── hooks/                  # React Hooks
├── stores/                 # Zustand stores
└── types/                  # TypeScript 类型定义
```

## 开发

```bash
# 安装依赖
bun install

# 开发模式
bun dev

# 构建
bun build

# 生产运行
bun start

# 代码检查
bun lint

# 类型检查
bun typecheck

# 测试
bun test
```

## 环境变量

在 `next.config.mjs` 中配置:

- `NEXT_PUBLIC_CHAIN_ID` - FIBOS 链 ID
- `NEXT_PUBLIC_RPC_ENDPOINT` - RPC 节点地址
- `NEXT_PUBLIC_CHAIN_NAME` - 链名称

## 功能模块

### Phase 1: 核心功能
- [x] 项目初始化
- [x] EOS 客户端封装
- [x] 工具函数
- [x] 首页搜索入口
- [x] 区块详情
- [x] 交易详情
- [x] 账户查询
- [x] 公钥查询

### Phase 2: 钱包功能
- [x] 钱包连接 (FO Wallet Plugin)
- [x] 转账功能
- [x] 资源管理 (RAM/CPU/NET)
- [x] 账户创建

### Phase 3: 投票系统
- [x] BP 投票
- [x] 代理投票
- [x] 节点状态查看

### Phase 4: 高级功能
- [ ] 多签管理
- [x] 合约调用
- [ ] Ledger 支持

## 参考文档

- [FEATURE_SPEC.md](../eoseco-explorer-frontend/FEATURE_SPEC.md) - 完整功能规格
- [PAGE_RESTRUCTURE.md](../eoseco-explorer-frontend/PAGE_RESTRUCTURE.md) - 页面重构规划
- [TECH_STACK_2026.md](../eoseco-explorer-frontend/TECH_STACK_2026.md) - 技术栈选型

## License

MIT
