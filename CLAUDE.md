# CLAUDE.md

## Project Overview

FIBOS Explorer Next - 基于 Next.js 15 + React 19 重构的 FIBOS 区块链浏览器。

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **UI**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand
- **Language**: TypeScript

## Commands

```bash
bun install        # 安装依赖
bun dev            # 开发服务器
bun build          # 生产构建
bun test           # 运行测试
```

## Reference Project

重构参考旧项目：`/Users/joshua/Dev/fibos/eoseco-explorer-frontend`

旧项目是 Angular 5 实现，包含完整的功能逻辑和 API 调用方式。重构时需要参考：

- **服务层逻辑**: `src/app/services/` - EosService, IronmanService 等
- **组件实现**: `src/app/components/` - 各页面组件的业务逻辑
- **API 调用**: 参考旧组件中的 HTTP 请求和 RPC 调用
- **环境配置**: `src/environments/fibos/configs/environment.ts`

## Documentation

详细功能规格文档在 `docs/` 目录：

- `FEATURE_SPEC.md` - 完整功能规格（API、数据结构、业务逻辑）
- `FEATURE_SPEC_SUPPLEMENT.md` - 补充文档（路由、验证规则、UI 细节）
- `PAGE_RESTRUCTURE.md` - 页面重构规划（新路由结构）

## Design Principles

1. **简洁优先** - 首页只保留搜索框，不堆砌信息
2. **功能聚合** - 相关功能归类到同一入口
3. **渐进复杂** - 简单操作易触达，高级功能可折叠

## Data Rules

**重要**: 页面能够获得的数据必须严格参照老项目实现。

- **禁止臆造数据**: 不要假设或编造 API 返回的数据字段，必须查看老项目的实际实现
- **参考老项目服务层**: 查看 `/Users/joshua/Dev/fibos/eoseco-explorer-frontend/src/app/services/` 了解数据获取方式
- **参考老项目组件**: 查看具体组件如何调用服务、处理数据、展示字段
- **API 对照**: 使用的 RPC 方法和参数必须与老项目一致
- **字段映射**: 页面展示的数据字段必须是 API 实际返回的字段，不能自行添加

示例：如果要实现账户页面，必须先查看：
1. `src/app/services/eos.service.ts` - 了解 `getAccount()` 的实现
2. `src/app/components/account/` - 了解账户组件如何使用数据
3. 确认实际可用的字段后再进行页面开发

## Project Structure

```
src/
├── app/                 # Next.js App Router 页面
│   ├── page.tsx         # 首页（搜索入口）
│   ├── explorer/        # 浏览器模块
│   ├── wallet/          # 钱包模块
│   └── voting/          # 投票模块
├── components/          # 共享组件
│   ├── ui/              # shadcn/ui 基础组件
│   └── features/        # 业务组件
├── lib/                 # 工具函数和服务
├── hooks/               # 自定义 Hooks
├── stores/              # Zustand 状态管理
└── types/               # TypeScript 类型定义
```

## Bun-specific

- Use `bun <file>` instead of `node <file>`
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Bun automatically loads .env

## Development Workflow

**编辑文件时的流程**：
1. 编辑前：先停止 `bun dev`（如果正在运行）
2. 执行编辑操作
3. 编辑后：重新启动 `bun dev`

## Deployment

**部署规则**：
- **禁止自动部署**: 不要在完成修改后自动执行部署命令
- 部署操作必须由用户明确请求后才能执行
- 使用 `vercel --prod` 部署到 Vercel

## TODO

待解决的问题：

- [x] ~~**钱包切换状态问题**: 已修复。每次连接时先清除旧状态，交易时验证钱包类型一致性，不再持久化账户信息。~~
- [x] ~~**eosjs-classic-fibos 多签支持**: 已修复。在 eosjs-classic-fibos 中添加了 binary extension 类型支持，approve action 的 proposal_hash 字段现在可以正确序列化。~~
