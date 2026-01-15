import Link from 'next/link'
import { ArrowLeft, User, Wallet, Cpu, HardDrive, Activity } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AccountPage({ params }: PageProps) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </Link>
          <h1 className="text-xl font-semibold text-white">FIBOS Explorer</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
            <User className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">账户详情</h2>
            <p className="text-white/50 text-sm mt-1">Account Details</p>
          </div>
        </div>

        {/* Account Name Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
              {id.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white/50 text-sm mb-1">账户名</p>
              <p className="text-white font-mono text-2xl">{id}</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">资产余额</span>
            </div>
            <p className="text-amber-400 text-sm">功能开发中...</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">CPU / NET</span>
            </div>
            <p className="text-amber-400 text-sm">功能开发中...</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">RAM 存储</span>
            </div>
            <p className="text-amber-400 text-sm">功能开发中...</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-orange-400" />
              <span className="text-white font-medium">交易记录</span>
            </div>
            <p className="text-amber-400 text-sm">功能开发中...</p>
          </div>
        </div>
      </div>
    </main>
  )
}
