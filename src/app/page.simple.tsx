import { SearchBox } from '@/components/features/SearchBox'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            FIBOS Explorer
          </h1>
          <p className="text-muted-foreground">
            区块链浏览器
          </p>
        </div>

        <SearchBox autoFocus className="w-full" />

        <p className="text-sm text-muted-foreground">
          支持搜索：区块号 · 交易哈希 · 账户名 · 公钥
        </p>
      </div>
    </main>
  )
}
